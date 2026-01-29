import json
import requests
import feedparser
import fitz # PyMuPDF
import datetime
import os
import time

ARXIV_QUERY = "cat:cs.AI"
MAX_RESULTS = 2

def download_and_extract_pdf(pdf_url):
    try:
        print(f"   ⬇️ Downloading: {pdf_url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(pdf_url, headers=headers)
        response.raise_for_status()
        
        with fitz.open(stream=response.content, filetype="pdf") as doc:
            full_text = ""
            stop_keywords = ["Conclusion", "References", "Bibliography", "Future Work"]
            should_stop = False
            
            for page in doc:
                text = page.get_text()
                for keyword in stop_keywords:
                    if f"\n{keyword}" in text or f"\n{keyword.upper()}" in text:
                        idx = -1
                        if f"\n{keyword}" in text:
                            idx = text.find(f"\n{keyword}")
                        elif f"\n{keyword.upper()}" in text:
                            idx = text.find(f"\n{keyword.upper()}")
                        
                        if idx != -1:
                            full_text += text[:idx]
                            should_stop = True
                            break
                if should_stop:
                    break
                full_text += text
        return full_text
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def fetch_arxiv_papers():
    print(f"🔍 Fetching {MAX_RESULTS} papers from Arxiv ({ARXIV_QUERY})...")
    url = f'http://export.arxiv.org/api/query?search_query={ARXIV_QUERY}&start=0&max_results={MAX_RESULTS}&sortBy=submittedDate&sortOrder=descending'
    response = requests.get(url)
    feed = feedparser.parse(response.content)
    
    for entry in feed.entries:
        arxiv_id = entry.id.split('/abs/')[-1]
        title = entry.title.replace('\n', ' ')
        pdf_url = entry.link.replace("abs", "pdf")
        
        print(f"\n📄 Processing: {title[:50]}... ({arxiv_id})")
        
        # 1. Download & Extract Text
        full_text = download_and_extract_pdf(pdf_url)
        
        if not full_text:
            print("   ⚠️ Skipping due to PDF error.")
            continue
            
        print(f"   ✅ Extracted {len(full_text)} characters.")
        # In a real scenario, you would now pass this to the LLM
        # analyze_paper_with_llm(full_text)

if __name__ == "__main__":
    fetch_arxiv_papers()
