import os
import PyPDF2

d = '../spec book references'
files = [f for f in os.listdir(d) if f.endswith('.pdf')]

for f in files:
    try:
        path = os.path.join(d, f)
        reader = PyPDF2.PdfReader(path)
        print(f"\n\n=================================\nFILE: {f}\n=================================\n")
        
        # Look at the first 30 pages
        for i in range(min(30, len(reader.pages))):
            page = reader.pages[i]
            text = page.extract_text()
            if not text: continue
            
            # Simple heuristic
            text_lower = text.lower()
            if 'table of contents' in text_lower or 'index' in text_lower or 'division' in text_lower:
                print(f"--- PAGE {i+1} ---")
                print(text[:1000]) # Print first 1000 chars of matching page
                print("...\n")
    except Exception as e:
        print(f"Error on {f}: {e}")
