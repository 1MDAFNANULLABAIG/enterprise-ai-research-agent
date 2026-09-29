import os
from typing import List, Dict, Any, Tuple
import pypdf
import docx
import pandas as pd

class DocumentExtractor:
    @staticmethod
    def extract_from_file(file_path: str, file_type: str) -> Tuple[List[Dict[str, Any]], int]:
        """
        Extracts pages/sections from a file.
        Returns:
            (pages_list: [{"page_number": int, "text": str, "section": Optional[str]}], total_pages: int)
        """
        file_type = file_type.lower().replace(".", "")
        if file_type == "pdf":
            return DocumentExtractor._extract_pdf(file_path)
        elif file_type == "docx":
            return DocumentExtractor._extract_docx(file_path)
        elif file_type == "csv":
            return DocumentExtractor._extract_csv(file_path)
        elif file_type == "txt":
            return DocumentExtractor._extract_txt(file_path)
        else:
            # Fallback to plain text read
            return DocumentExtractor._extract_txt(file_path)

    @staticmethod
    def _extract_pdf(file_path: str) -> Tuple[List[Dict[str, Any]], int]:
        pages = []
        try:
            reader = pypdf.PdfReader(file_path)
            total = len(reader.pages)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages.append({
                    "page_number": idx + 1,
                    "text": text.strip(),
                    "section": f"Page {idx + 1}"
                })
            return pages, max(total, 1)
        except Exception as e:
            # Fallback if corrupt
            return [{"page_number": 1, "text": f"Error extracting PDF: {str(e)}", "section": "Error"}], 1

    @staticmethod
    def _extract_docx(file_path: str) -> Tuple[List[Dict[str, Any]], int]:
        try:
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            full_text = "\n\n".join(paragraphs)
            # Estimate pages: roughly 500 words per page
            words = full_text.split()
            page_size = 500
            total_pages = max(1, (len(words) + page_size - 1) // page_size)
            pages = []
            for i in range(total_pages):
                chunk_words = words[i * page_size:(i + 1) * page_size]
                pages.append({
                    "page_number": i + 1,
                    "text": " ".join(chunk_words),
                    "section": f"Section {i + 1}"
                })
            return pages, total_pages
        except Exception as e:
            return [{"page_number": 1, "text": f"Error extracting DOCX: {str(e)}", "section": "Error"}], 1

    @staticmethod
    def _extract_txt(file_path: str) -> Tuple[List[Dict[str, Any]], int]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Split sections by CHAPTER or SECTION if present, or length
            paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
            pages = []
            current_page_text = []
            current_page_len = 0
            page_num = 1

            for p in paragraphs:
                current_page_text.append(p)
                current_page_len += len(p)
                if current_page_len > 2500:
                    pages.append({
                        "page_number": page_num,
                        "text": "\n\n".join(current_page_text),
                        "section": f"Page {page_num}"
                    })
                    page_num += 1
                    current_page_text = []
                    current_page_len = 0

            if current_page_text or not pages:
                pages.append({
                    "page_number": page_num,
                    "text": "\n\n".join(current_page_text) if current_page_text else content,
                    "section": f"Page {page_num}"
                })

            return pages, len(pages)
        except Exception as e:
            return [{"page_number": 1, "text": f"Error extracting TXT: {str(e)}", "section": "Error"}], 1

    @staticmethod
    def _extract_csv(file_path: str) -> Tuple[List[Dict[str, Any]], int]:
        try:
            df = pd.read_csv(file_path)
            summary_parts = [
                f"CSV Dataset Overview: {len(df)} rows by {len(df.columns)} columns.",
                f"Columns: {', '.join(df.columns.tolist())}.",
                "\nStatistical Summary of Numerical Columns:\n" + df.describe().to_string(),
                "\nSample First 10 Rows:\n" + df.head(10).to_string()
            ]
            full_text = "\n\n".join(summary_parts)
            return [{
                "page_number": 1,
                "text": full_text,
                "section": "CSV Summary & Structure"
            }], 1
        except Exception as e:
            return [{"page_number": 1, "text": f"Error parsing CSV: {str(e)}", "section": "Error"}], 1
