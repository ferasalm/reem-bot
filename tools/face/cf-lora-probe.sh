#!/usr/bin/env bash
# Owner 2026-10-13 (Step B): can Workers AI's klein 9B take the Lenovo UltraReal LoRA (Civitai version 2682771, rank 32, PEFT, 165 MB)?
# Cloudflare's LoRA docs list only text models; this asks the API itself. Free apart from 3 klein 9B pictures (~$0.05).
# Run by .github/workflows/cf-lora-probe.yml on a push of this file (never on dev/main). Prints every answer; pictures go to out/.
set -u
M="@cf/black-forest-labs/flux-2-klein-9b"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai"
AUTH="Authorization: Bearer $CLOUDFLARE_API_TOKEN"
URL="https://b2.civitai.com/file/civitai-modelfiles/model/2703479/lenovoFluxKlein9b.tAkL.safetensors?Authorization=3_20261013003345_4394f241f0c6f880c1affd7c_8910b7907a4b01f74c604ae0d3d3cf253b1f6c07_004_20261013013345_0048_dnld&b2ContentDisposition=attachment%3B+filename%3D%22lenovo_flux_klein9b.safetensors%22" # Civitai's signed link (24 h), as LESSONS says: Actions has no Civitai key
mkdir -p out lora
echo "== download"; curl -sS -L -o lora/adapter_model.safetensors "$URL"; ls -la lora
cat > lora/adapter_config.json <<'J'
{"peft_type": "LORA", "r": 32, "lora_alpha": 32, "base_model_name_or_path": "black-forest-labs/FLUX.2-klein-9B", "model_type": "flux2", "target_modules": ["to_out", "to_qkv_mlp_proj", "to_q", "to_k", "to_v", "add_q_proj", "add_k_proj", "add_v_proj", "to_add_out"]}
J
draw() { # name, extra form args...
  local name="$1"; shift
  echo "== draw $name"
  local t0=$(date +%s)
  curl -sS -o "out/$name.json" -w "HTTP %{http_code}\n" -H "$AUTH" -F "prompt=Realistic candid smartphone photo of a 29-year-old woman with dark wavy hair in a messy bun, a gray knit cardigan over a black tank top, sitting on a worn olive sofa by a window, soft window light." -F width=768 -F height=1344 -F seed=4242 "$@" "$API/run/$M"
  echo "seconds $(($(date +%s)-t0))"
  python3 - "$name" <<'P'
import json, sys, base64, hashlib
n = sys.argv[1]
d = json.load(open(f"out/{n}.json"))
img = (d.get("result") or {}).get("image")
if img:
    b = base64.b64decode(img); open(f"out/{n}.jpg", "wb").write(b)
    print("image bytes", len(b), "sha", hashlib.sha256(b).hexdigest()[:16])
else:
    print("answer", json.dumps(d)[:600])
P
}
draw plain
draw bogus-lora -F "lora=no-such-lora-xyz"
echo "== finetune list"; curl -sS -H "$AUTH" "$API/finetunes" | head -c 1500; echo
echo "== finetune create (wrangler)"
npx --yes wrangler@4.145.0 ai finetune create "$M" reem-lenovo lora 2>&1 | tail -30
echo "== finetune create (REST)"
curl -sS -H "$AUTH" -H "Content-Type: application/json" -d "{\"model\":\"$M\",\"name\":\"reem-lenovo-rest\",\"description\":\"Lenovo UltraReal probe\"}" "$API/finetunes" | head -c 1500; echo
draw with-lora -F "lora=reem-lenovo"
echo "== done"
