import os
import shutil
import uuid
from pathlib import Path
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.document import Document
from app.workers.async_processor import DocumentIngestionProcessor
from app.core.config import settings

def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin User
        admin = db.query(User).filter(User.email == "admin@enterprise.ai").first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                email="admin@enterprise.ai",
                hashed_password=get_password_hash("AdminPass123!"),
                full_name="Enterprise Admin",
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Created admin user: admin@enterprise.ai (pass: AdminPass123!)")
        else:
            print("Admin user already exists.")

        # 2. Analyst User
        analyst = db.query(User).filter(User.email == "analyst@enterprise.ai").first()
        if not analyst:
            analyst = User(
                id=str(uuid.uuid4()),
                email="analyst@enterprise.ai",
                hashed_password=get_password_hash("AnalystPass123!"),
                full_name="Senior AI Analyst",
                role="user",
                is_active=True
            )
            db.add(analyst)
            db.commit()
            db.refresh(analyst)
            print(f"Created analyst user: analyst@enterprise.ai (pass: AnalystPass123!)")

        # 3. Seed Demo Documents
        demo_dir = Path(__file__).resolve().parent.parent / "demo_data"
        if not demo_dir.exists():
            print("Demo data directory not found, skipping document seed.")
            return

        demo_files = [
            ("ACME_Corp_Q3_2025_Financial_Report.txt", "txt"),
            ("Enterprise_Cybersecurity_Framework_2025.txt", "txt"),
            ("Multi_Cloud_AI_Architecture_Strategy.txt", "txt"),
            ("Enterprise_Product_Sales_Metrics_2025.csv", "csv")
        ]

        for filename, ftype in demo_files:
            src_file = demo_dir / filename
            if not src_file.exists():
                print(f"Skipping {filename}, file not found.")
                continue

            existing_doc = db.query(Document).filter(
                Document.user_id == admin.id,
                Document.filename == filename
            ).first()

            if existing_doc and existing_doc.status == "INDEXED":
                print(f"Document {filename} already indexed.")
                continue

            # Copy to storage uploads
            doc_id = existing_doc.id if existing_doc else str(uuid.uuid4())
            dest_filename = f"{doc_id}_{filename}"
            dest_path = os.path.join(settings.STORAGE_DIR, dest_filename)
            shutil.copyfile(str(src_file), dest_path)

            file_size = os.path.getsize(dest_path)

            if not existing_doc:
                doc = Document(
                    id=doc_id,
                    user_id=admin.id,
                    filename=filename,
                    original_name=filename,
                    file_path=dest_path,
                    file_type=ftype,
                    file_size_bytes=file_size,
                    status="UPLOADED"
                )
                db.add(doc)
                db.commit()
                db.refresh(doc)
            else:
                doc = existing_doc

            print(f"Processing and indexing: {filename}...")
            success = DocumentIngestionProcessor.process_document_sync(db, doc.id)
            if success:
                print(f"-> Indexed {filename} successfully ({doc.chunk_count} chunks)")
            else:
                print(f"-> Failed to index {filename}: {doc.error_message}")

        print("\nDemo dataset seeding completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
