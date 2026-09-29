import re
from typing import List, Dict, Any

class SemanticChunker:
    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_pages(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        chunks = []
        global_chunk_idx = 0

        for page in pages:
            page_num = page.get("page_number", 1)
            section = page.get("section", f"Page {page_num}")
            text = page.get("text", "").strip()

            if not text:
                continue

            page_chunks = self._split_text(text)
            for c_text in page_chunks:
                if not c_text.strip():
                    continue
                words = c_text.split()
                chunks.append({
                    "chunk_index": global_chunk_idx,
                    "page_number": page_num,
                    "section_title": section,
                    "content": c_text.strip(),
                    "token_count": len(words)
                })
                global_chunk_idx += 1

        return chunks

    def _split_text(self, text: str) -> List[str]:
        # Split by double newline first
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        result_chunks = []
        current_chunk = []
        current_length = 0

        for para in paragraphs:
            para_len = len(para)
            if current_length + para_len <= self.chunk_size:
                current_chunk.append(para)
                current_length += para_len + 2
            else:
                if current_chunk:
                    result_chunks.append("\n\n".join(current_chunk))
                    # Overlap: keep the last paragraph if small enough
                    if len(current_chunk[-1]) < self.chunk_overlap:
                        current_chunk = [current_chunk[-1], para]
                        current_length = len(current_chunk[0]) + para_len + 2
                    else:
                        current_chunk = [para]
                        current_length = para_len
                else:
                    # Paragraph itself is longer than chunk_size, split by sentences
                    sentences = re.split(r'(?<=[.!?])\s+', para)
                    s_chunk = []
                    s_len = 0
                    for s in sentences:
                        if s_len + len(s) <= self.chunk_size:
                            s_chunk.append(s)
                            s_len += len(s) + 1
                        else:
                            if s_chunk:
                                result_chunks.append(" ".join(s_chunk))
                            s_chunk = [s]
                            s_len = len(s)
                    if s_chunk:
                        current_chunk = [" ".join(s_chunk)]
                        current_length = s_len

        if current_chunk:
            result_chunks.append("\n\n".join(current_chunk))

        return result_chunks
