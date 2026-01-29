from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import requests
import fitz # PyMuPDF
import io

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Invalid JSON')
            return
        
        pdf_url = body.get('url')
        file_path = body.get('file_path')

        if not pdf_url and not file_path:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Missing url or file_path')
            return

        try:
            stream = None
            if file_path:
                print(f"Reading local file: {file_path}")
                # Open local file
                with open(file_path, 'rb') as f:
                    file_content = f.read()
                stream = file_content
            else:
                # Download PDF
                print(f"Downloading PDF: {pdf_url}")
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                response = requests.get(pdf_url, headers=headers)
                response.raise_for_status()
                stream = response.content
            
            # Open PDF
            print("Parsing PDF...")
            with fitz.open(stream=stream, filetype="pdf") as doc:
                full_text = ""
                stop_keywords = ["Conclusion", "References", "Bibliography", "Future Work"]
                should_stop = False
                
                for page in doc:
                    text = page.get_text()
                    
                    # Naive check for stop keywords to stop processing further pages
                    for keyword in stop_keywords:
                        # Check for Section Header style (New line + Keyword)
                        if f"\n{keyword}" in text or f"\n{keyword.upper()}" in text:
                            # Append text up to keyword
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
            
            print(f"Extracted {len(full_text)} chars")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'text': full_text}).encode('utf-8'))
            
        except Exception as e:
            print(f"Error: {str(e)}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

def run(server_class=HTTPServer, handler_class=Handler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting httpd on port {port}...')
    httpd.serve_forever()

if __name__ == "__main__":
    run()
