# Turns a FLUX.2 klein LoKR (LyCORIS: <module>.lokr_w1 + .lokr_w2 + .alpha, BFL naming) into the plain LoRA Runware loads
# (<module>.lora_A.weight / .lora_B.weight), bf16, cut to --rank N.
# 2026-10-08: Runware refused SNOFS klein 9B v1.4 (ai-toolkit LoKR, full w1 4x4 and full w2) with "LoRA model failed to load".
# Change per module: kron(w1, w2) * scale; scale 1 when both factors are full (ai-toolkit stores alpha 1e10 for that), else
# alpha / rank of the decomposed w2 (w2_a @ w2_b). The SVD of a Kronecker product is the Kronecker product of the factors'
# SVDs, so the best rank-N cut is exact and cheap: the N largest products s1[i] * s2[j] with kron(u1i, u2j), kron(v1i, v2j).
# Prints how much of the change (Frobenius norm) is kept. Usage: python3 lokr-to-lora.py in.safetensors out.safetensors --rank N
import sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lora_io import load_keys, save  # noqa: E402

args = [a for a in sys.argv[1:] if not a.startswith("--")]
rank = int(sys.argv[sys.argv.index("--rank") + 1]) if "--rank" in sys.argv else 128
args = [a for a in args if a != str(rank)]
get, keys = load_keys(args[0])
mods = sorted({k.rsplit(".", 1)[0] for k in keys if ".lokr_" in k or k.endswith(".alpha")})
out, kept = {}, []
for m in mods:
    if f"{m}.lokr_w1" not in keys:
        sys.exit(f"{m}: no lokr_w1 (decomposed w1 isn't handled): refusing to write a partial LoRA")
    w1 = get(f"{m}.lokr_w1")
    if f"{m}.lokr_w2" in keys:
        w2, scale = get(f"{m}.lokr_w2"), 1.0
    else:
        w2a, w2b = get(f"{m}.lokr_w2_a"), get(f"{m}.lokr_w2_b")
        w2 = w2a @ w2b
        alpha = float(get(f"{m}.alpha")) if f"{m}.alpha" in keys else w2a.shape[1]
        scale = alpha / w2a.shape[1]
    if w2.ndim != 2:
        sys.exit(f"{m}: conv LoKR isn't handled")
    u1, s1, v1 = np.linalg.svd(w1 * scale, full_matrices=False)
    u2, s2, v2 = np.linalg.svd(w2, full_matrices=False)
    prod = np.outer(s1, s2)
    order = np.argsort(prod, axis=None)[::-1][:rank]
    ii, jj = np.unravel_index(order, prod.shape)
    sv = prod[ii, jj]
    kept.append(float(np.sqrt((sv ** 2).sum() / (prod ** 2).sum())))
    root = np.sqrt(sv)
    up = np.stack([np.kron(u1[:, i], u2[:, j]) for i, j in zip(ii, jj)], axis=1) * root  # [out, r]
    down = np.stack([np.kron(v1[i], v2[j]) for i, j in zip(ii, jj)], axis=0) * root[:, None]  # [r, in]
    out[f"{m}.lora_A.weight"], out[f"{m}.lora_B.weight"] = down.astype(np.float32), up.astype(np.float32)
print(f"{len(mods)} modules; rank {rank}: kept {min(kept):.3f} (worst module) to {np.mean(kept):.3f} (mean) of the change")
save(args[1], out, {"ss_base_model_version": "flux2_klein_9b", "converted_from": f"LoKR, rank {rank} cut"})
