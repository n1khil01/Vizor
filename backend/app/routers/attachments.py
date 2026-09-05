"""POST /attachments/extract-pdf — pulls text out of a PDF the student
attaches (e.g. their DARS/graduation audit) so the extension can hold it as
a session-only chat attachment, same shape as its plain-text attachments
(see extension/content.js `pendingAttachments`, app/routers/chat.py
`Attachment`). Nothing here is written to the database — the file is read,
extracted, and discarded."""

from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.auth import CurrentUser, require_student

router = APIRouter(prefix="/attachments", tags=["attachments"])

MAX_PDF_BYTES = 8_000_000
MAX_EXTRACTED_CHARS = 60_000


@router.post("/extract-pdf")
async def extract_pdf(
    file: UploadFile,
    user: CurrentUser = Depends(require_student),
) -> dict:
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a PDF")

    data = await file.read(MAX_PDF_BYTES + 1)
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="PDF too large (8MB max)")

    try:
        reader = PdfReader(BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
    except PdfReadError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Couldn't read that PDF") from exc

    text = "\n\n".join(p.strip() for p in pages if p.strip())
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No extractable text found — is this a scanned image PDF?",
        )

    return {"text": text[:MAX_EXTRACTED_CHARS]}
