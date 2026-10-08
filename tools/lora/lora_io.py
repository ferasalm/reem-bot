# safetensors read/write in pure numpy for the LoRA converters (dora-to-lora.py, lokr-to-lora.py); bf16 out.
import json, struct
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

def load_keys(path):  # (get(key) -> float32 array, set of keys), reading one tensor at a time
    with open(path, "rb") as f:
        n = struct.unpack("<Q", f.read(8))[0]
        head = json.loads(f.read(n))
    head.pop("__metadata__", None)
    mm, base = np.memmap(path, dtype=np.uint8, mode="r"), 8 + n
    def get(k):
        v = head[k]; a, b = v["data_offsets"]
        arr = np.frombuffer(mm[base + a: base + b], dtype=DT[v["dtype"]]).reshape(v["shape"])
        return ((arr.astype(np.uint32) << 16).view(np.float32) if v["dtype"] == "BF16" else arr).astype(np.float32)
    return get, set(head)
