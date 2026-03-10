import sys
import pytesseract
from PIL import Image

def main():
    if len(sys.argv) < 2:
        print("Usage: python ocr_script.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    
    try:
        # Assumes tesseract is in the system PATH.
        # If not, the user may need to uncomment and set the following line:
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        text = pytesseract.image_to_string(Image.open(image_path))
        print(text)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
