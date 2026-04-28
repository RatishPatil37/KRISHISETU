"""
crop_model_inference.py
-----------------------
Runs inference using Crop_Model.pt — a YOLOv8 classification model
trained with the ultralytics library on 24 crop disease classes.

Usage:
    python crop_model_inference.py <image_path> <model_path>

Output (stdout — pure JSON, nothing else):
    {
      "cropName": "Apple",
      "condition": "Apple Scab",
      "fullLabel": "Apple__Apple_scab",
      "classIndex": 0,
      "confidence": 0.94,
      "isHealthy": false,
      "allPredictions": [...]
    }
"""

import sys
import os
import json

# ── 24 exact class labels (index = class ID from training) ────────────────────
CLASS_NAMES = {
    0:  'Apple__Apple_scab',
    1:  'Apple__Black_rot',
    2:  'Apple__Cedar_apple_rust',
    3:  'Apple__healthy',
    4:  'Bellpepper__Bacterial_spot',
    5:  'Bellpepper__healthy',
    6:  'Corn__Common_rust',
    7:  'Corn__Gray_leaf_spot',
    8:  'Corn__Northern_Leaf_Blight',
    9:  'Corn__healthy',
    10: 'Grape__Black_Measles',
    11: 'Grape__Black_rot',
    12: 'Grape__Leaf_blight',
    13: 'Grape__healthy',
    14: 'Potato__Early_blight',
    15: 'Potato__Late_blight',
    16: 'Potato__healthy',
    17: 'Rice__Brown_Spot',
    18: 'Rice__Healthy',
    19: 'Rice__Leaf_Blast',
    20: 'Rice__Neck_Blast',
    21: 'Wheat__Brown_Rust',
    22: 'Wheat__Healthy',
    23: 'Wheat__Yellow_Rust',
}


def parse_label(label_str):
    """
    'Apple__Apple_scab' → ('Apple', 'Apple Scab', False)
    'Apple__healthy'    → ('Apple', 'Healthy',    True)
    """
    parts = label_str.split('__', 1)
    crop  = parts[0].strip()
    raw   = parts[1] if len(parts) > 1 else label_str
    condition  = raw.replace('_', ' ').strip()
    is_healthy = raw.lower() in ('healthy', 'healthy_leaf')
    return crop, condition, is_healthy


def error_out(msg):
    """Print error JSON to stdout and exit — Node.js reads stdout."""
    print(json.dumps({'error': str(msg)}), flush=True)
    sys.exit(1)


def get_name_from_model(names_attr, idx):
    """Safely resolve class name from model.names (dict or list)."""
    if isinstance(names_attr, dict):
        return names_attr.get(idx, CLASS_NAMES.get(idx, f'Class_{idx}'))
    if isinstance(names_attr, (list, tuple)) and idx < len(names_attr):
        return names_attr[idx]
    return CLASS_NAMES.get(idx, f'Class_{idx}')


# ─────────────────────────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 3:
        error_out('Usage: python crop_model_inference.py <image_path> <model_path>')

    image_path = sys.argv[1]
    model_path = sys.argv[2]

    if not os.path.exists(image_path):
        error_out(f'Image file not found: {image_path}')
    if not os.path.exists(model_path):
        error_out(f'Model file not found: {model_path}')

    # ── Try ultralytics first (YOLOv8 model) ──────────────────────────────────
    try:
        from ultralytics import YOLO
        result = run_ultralytics(model_path, image_path)
        print(json.dumps(result), flush=True)
        return
    except ImportError:
        pass  # ultralytics not installed — fall through to torch
    except Exception as e:
        error_out(f'ultralytics inference error: {e}')

    # ── Fallback: plain torch.load ─────────────────────────────────────────────
    try:
        import torch
    except ImportError:
        error_out('Neither ultralytics nor torch is installed.\nRun: pip install ultralytics')

    try:
        from PIL import Image
        import torchvision.transforms as transforms
    except ImportError:
        error_out('Pillow / torchvision not installed. Run: pip install Pillow torchvision')

    try:
        result = run_torch(model_path, image_path)
        print(json.dumps(result), flush=True)
    except Exception as e:
        error_out(f'torch inference error: {e}')


# ─────────────────────────────────────────────────────────────────────────────
# METHOD 1: ultralytics YOLO (primary — for YOLOv8 .pt models)
# ─────────────────────────────────────────────────────────────────────────────
def run_ultralytics(model_path, image_path):
    from ultralytics import YOLO

    model   = YOLO(model_path)
    results = model(image_path, verbose=False)
    r       = results[0]

    # Classification task → r.probs
    if hasattr(r, 'probs') and r.probs is not None:
        top_idx  = int(r.probs.top1)
        top_conf = float(r.probs.top1conf.item())

        # Use hardcoded CLASS_NAMES (guaranteed correct label order)
        top_label               = CLASS_NAMES.get(top_idx, get_name_from_model(model.names, top_idx))
        crop, condition, healthy = parse_label(top_label)

        # Build top-5 from probability tensor
        probs_tensor = r.probs.data
        top5_idx     = probs_tensor.topk(min(5, len(probs_tensor))).indices.tolist()
        all_preds    = []
        for idx in top5_idx:
            lbl = CLASS_NAMES.get(idx, get_name_from_model(model.names, idx))
            c, cond, h = parse_label(lbl)
            all_preds.append({
                'classIndex': idx,
                'fullLabel':  lbl,
                'cropName':   c,
                'condition':  cond,
                'isHealthy':  h,
                'confidence': round(float(probs_tensor[idx].item()), 6)
            })

        return {
            'cropName':       crop,
            'condition':      condition,
            'fullLabel':      top_label,
            'classIndex':     top_idx,
            'confidence':     round(top_conf, 6),
            'isHealthy':      healthy,
            'allPredictions': all_preds
        }

    error_out('Model did not return classification probabilities. Is Crop_Model.pt a classifier?')


# ─────────────────────────────────────────────────────────────────────────────
# METHOD 2: plain torch (fallback for non-ultralytics .pt files)
# ─────────────────────────────────────────────────────────────────────────────
def run_torch(model_path, image_path):
    import torch
    import torch.nn as nn
    import torchvision.transforms as transforms
    import torchvision.models as tv_models
    from PIL import Image

    device     = torch.device('cpu')
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)

    # Resolve model object
    if isinstance(checkpoint, nn.Module):
        model = checkpoint
    elif isinstance(checkpoint, dict) and 'model' in checkpoint:
        model = checkpoint['model'].float()
    elif isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
        model = _build_resnet(checkpoint['state_dict'], tv_models)
    elif isinstance(checkpoint, dict):
        model = _build_resnet(checkpoint, tv_models)
    else:
        raise ValueError(f'Unknown checkpoint type: {type(checkpoint)}')

    model = model.eval().to(device)

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std= [0.229, 0.224, 0.225]),
    ])

    img    = Image.open(image_path).convert('RGB')
    tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(tensor)
        probs  = torch.softmax(output, dim=1)[0]

    top_idx  = int(probs.argmax().item())
    top_conf = float(probs[top_idx].item())
    top_label               = CLASS_NAMES.get(top_idx, f'Class_{top_idx}')
    crop, condition, healthy = parse_label(top_label)

    indexed   = sorted(enumerate(probs.tolist()), key=lambda x: -x[1])[:5]
    all_preds = []
    for idx, prob in indexed:
        lbl = CLASS_NAMES.get(idx, f'Class_{idx}')
        c, cond, h = parse_label(lbl)
        all_preds.append({
            'classIndex': idx, 'fullLabel': lbl,
            'cropName': c, 'condition': cond,
            'isHealthy': h, 'confidence': round(prob, 6)
        })

    return {
        'cropName': crop, 'condition': condition,
        'fullLabel': top_label, 'classIndex': top_idx,
        'confidence': round(top_conf, 6), 'isHealthy': healthy,
        'allPredictions': all_preds
    }


def _build_resnet(state_dict, tv_models):
    import torch.nn as nn
    backbone    = tv_models.resnet50(weights=None)
    backbone.fc = nn.Linear(backbone.fc.in_features, len(CLASS_NAMES))
    try:
        backbone.load_state_dict(state_dict, strict=True)
    except RuntimeError:
        backbone.load_state_dict(state_dict, strict=False)
    return backbone


if __name__ == '__main__':
    main()
