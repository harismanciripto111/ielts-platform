import pdfplumber
import json
import sys
from pathlib import Path

def extract_text(pdf_path):
    pages_text = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                pages_text.append({"page": i + 1, "text": text})
    return {
        "source": Path(pdf_path).stem,
        "total_pages": len(pages_text),
        "pages": pages_text,
        "questions": []
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract.py <pdf_file>")
        sys.exit(1)
    pdf_file = sys.argv[1]
    result = extract_text(pdf_file)
    output_file = pdf_file.replace('.pdf', '.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print("Extracted " + str(result['total_pages']) + " pages to " + output_file)
