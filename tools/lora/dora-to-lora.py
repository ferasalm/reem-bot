# Turns a FLUX.2 klein LoRA/DoRA in diffusers naming (transformer.transformer_blocks.N.attn.to_q.lora_down.weight + alpha
# + dora_scale) into the BFL naming Runware loads (diffusion_model.double_blocks.N.img_attn.qkv.lora_A.weight), bf16.
# 2026-10-08: Runware refused "Real HD 2k" (a DoRA) with "LoRA model failed to load"; the two LoRAs it loads use this naming.
# DoRA's magnitude (dora_scale) can't be folded in without the base model's weights, so it is dropped (an approximation);
# alpha/rank is folded into lora_B; q, k and v become one fused qkv LoRA (down stacked, up block-diagonal).
# --rank N (2026-10-08): each module cut to rank N by SVD (the 400 MB file was refused by litterbox and 0x0.st; rank 32 =
# 166 MB, the size of the LoRAs Runware loads); prints how much of the change (Frobenius norm) is kept.
# Pure numpy (no torch, no safetensors package). Usage: python3 dora-to-lora.py in.safetensors out.safetensors [--rank N]
import json, struct, sys
import numpy as np

DT = {"F32": np.float32, "F16": np.float16, "BF16": np.uint16}

def load(path):
    with open(path, "rb") as f:
        n = struct.unpack("<Q", f.read(8))[0]
        head = json.loads(f.read(n))
        base = 8 + n
    head.pop("__metadata__", None)
    mm = np.memmap(path, dtype=np.uint8, mode="r")
    out = {}
    for k, v in head.items():
        a, b = v["data_offsets"]
        arr = np.frombuffer(mm[base + a: base + b], dtype=DT[v["dtype"]]).reshape(v["shape"])
        if v["dtype"] == "BF16":
            arr = (arr.astype(np.uint32) << 16).view(np.float32)
        out[k] = arr.astype(np.float32)
    return out

def bf16(a):
    u = np.ascontiguousarray(a, dtype=np.float32).view(np.uint32)
    return ((u + 0x7FFF + ((u >> 16) & 1)) >> 16).astype(np.uint16)  # round to nearest even

def save(path, tensors, meta):
    head, blobs, off = {"__metadata__": meta}, [], 0
    for k, a in tensors.items():
        b = bf16(a).tobytes()
        head[k] = {"dtype": "BF16", "shape": list(a.shape), "data_offsets": [off, off + len(b)]}
        blobs.append(b); off += len(b)
    h = json.dumps(head, separators=(",", ":")).encode()
    h += b" " * ((8 - len(h) % 8) % 8)
    with open(path, "wb") as f:
        f.write(struct.pack("<Q", len(h))); f.write(h)
        for b in blobs: f.write(b)

args = [a for a in sys.argv[1:] if not a.startswith("--")]
rank = int(sys.argv[sys.argv.index("--rank") + 1]) if "--rank" in sys.argv else 0
if rank: args = [a for a in args if a != str(rank)]
src = load(args[0])
kept = []

def cut(down, up):  # best rank-`rank` approximation of up @ down, via QR of both factors and an SVD of the small core
    if not rank or down.shape[0] <= rank: return down, up
    qb, rb = np.linalg.qr(up); qa, ra = np.linalg.qr(down.T)
    u, sv, vt = np.linalg.svd(rb @ ra.T)
    kept.append(float(np.sqrt((sv[:rank] ** 2).sum() / (sv ** 2).sum())))
    root = np.sqrt(sv[:rank])
    return (root[:, None] * vt[:rank]) @ qa.T, qb @ (u[:, :rank] * root)

def lora(prefix):  # (down [r,in], up*scale [out,r]) of one diffusers module
    down, up = src[f"{prefix}.lora_down.weight"], src[f"{prefix}.lora_up.weight"]
    alpha = src.get(f"{prefix}.alpha")
    scale = float(alpha) / down.shape[0] if alpha is not None else 1.0
    return down, up * scale

def fused(prefixes):
    parts = [lora(p) for p in prefixes]
    down = np.concatenate([d for d, _ in parts], axis=0)
    up = np.zeros((sum(u.shape[0] for _, u in parts), down.shape[0]), np.float32)
    r = o = 0
    for d, u in parts:
        up[o:o + u.shape[0], r:r + d.shape[0]] = u
        r += d.shape[0]; o += u.shape[0]
    return down, up

out = {}
def put(name, pair):
    out[f"diffusion_model.{name}.lora_A.weight"], out[f"diffusion_model.{name}.lora_B.weight"] = cut(*pair)

blocks = sorted({int(k.split(".")[2]) for k in src if k.startswith("transformer.transformer_blocks.")})
singles = sorted({int(k.split(".")[2]) for k in src if k.startswith("transformer.single_transformer_blocks.")})
for i in blocks:
    t = f"transformer.transformer_blocks.{i}"
    put(f"double_blocks.{i}.img_attn.qkv", fused([f"{t}.attn.to_q", f"{t}.attn.to_k", f"{t}.attn.to_v"]))
    put(f"double_blocks.{i}.txt_attn.qkv", fused([f"{t}.attn.add_q_proj", f"{t}.attn.add_k_proj", f"{t}.attn.add_v_proj"]))
    put(f"double_blocks.{i}.img_attn.proj", lora(f"{t}.attn.to_out.0"))
    put(f"double_blocks.{i}.txt_attn.proj", lora(f"{t}.attn.to_add_out"))
    put(f"double_blocks.{i}.img_mlp.0", lora(f"{t}.ff.linear_in"))
    put(f"double_blocks.{i}.img_mlp.2", lora(f"{t}.ff.linear_out"))
    put(f"double_blocks.{i}.txt_mlp.0", lora(f"{t}.ff_context.linear_in"))
    put(f"double_blocks.{i}.txt_mlp.2", lora(f"{t}.ff_context.linear_out"))
for i in singles:
    t = f"transformer.single_transformer_blocks.{i}"
    put(f"single_blocks.{i}.linear1", lora(f"{t}.attn.to_qkv_mlp_proj"))
    put(f"single_blocks.{i}.linear2", lora(f"{t}.attn.to_out"))

used = {k.rsplit(".", 2)[0] if k.endswith(".weight") else k.rsplit(".", 1)[0] for k in src}
done = len(blocks) * 12 + len(singles) * 2
print(f"{len(blocks)} double blocks, {len(singles)} single blocks: {done} of {len(used)} modules mapped; {len(out)} tensors written")
if done != len(used):
    sys.exit("some modules weren't mapped: refusing to write a partial LoRA")
if kept: print(f"rank {rank}: kept {min(kept):.3f} (worst module) to {np.mean(kept):.3f} (mean) of the change")
save(args[1], out, {"ss_base_model_version": "flux2_klein_9b", "converted_from": "diffusers DoRA (dora_scale dropped)"})
