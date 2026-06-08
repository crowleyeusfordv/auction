import os
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from supabase import create_client, Client
from uuid import uuid4
import mimetypes

upload_router = APIRouter()
UPLOAD_DIR = Path(os.getenv("LOCAL_UPLOAD_DIR", Path(__file__).resolve().parents[2] / "uploads"))


def build_filename(file: UploadFile) -> str:
    ext = mimetypes.guess_extension(file.content_type or "") or ""
    if not ext and file.filename:
        ext = os.path.splitext(file.filename)[1]

    return f"{uuid4()}{ext}"


def validate_file_size(file_bytes: bytes) -> None:
    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max 50MB.")


def save_local_upload(filename: str, file_bytes: bytes) -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / filename).write_bytes(file_bytes)


def get_public_base_url(request: Request) -> str:
    configured_url = (
        os.getenv("PUBLIC_BASE_URL")
        or os.getenv("BACKEND_PUBLIC_URL")
        or os.getenv("RENDER_EXTERNAL_URL")
    )

    if configured_url:
        return configured_url.rstrip("/")

    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    forwarded_host = request.headers.get(
        "x-forwarded-host",
        request.headers.get("host", request.url.netloc),
    )
    proto = forwarded_proto.split(",")[0].strip()
    host = forwarded_host.split(",")[0].strip()

    return f"{proto}://{host}".rstrip("/")


def build_local_upload_url(request: Request, filename: str) -> str:
    return f"{get_public_base_url(request)}/uploads/{filename}"


@upload_router.post('/upload')
async def upload_file(request: Request, file: UploadFile = File(...)):
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')

    try:
        file_bytes = await file.read()
        validate_file_size(file_bytes)

        filename = build_filename(file)

        if not SUPABASE_URL or not SUPABASE_KEY:
            save_local_upload(filename, file_bytes)
            return {"url": build_local_upload_url(request, filename)}

        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase.storage.from_('auctions').upload(
            path=filename,
            file=file_bytes,
            file_options={'content-type': file.content_type}
        )

        public_url = supabase.storage.from_('auctions').get_public_url(filename)

        return {"url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
