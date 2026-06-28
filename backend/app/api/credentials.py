import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.deps import CurrentUser
from app.core.encryption import decrypt_value, encrypt_value
from app.core.errors import NotFoundError
from app.database import get_db
from app.models.credential import Credential

router = APIRouter(prefix="/credentials", tags=["credentials"])


class CredentialCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=100)
    data: dict = Field(default_factory=dict)


class CredentialResponse(BaseModel):
    id: int
    name: str
    type: str
    created_at: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[CredentialResponse])
async def list_credentials(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> list[CredentialResponse]:
    result = await db.execute(
        select(Credential).where(Credential.owner_id == user.id).order_by(Credential.created_at.desc())
    )
    return [
        CredentialResponse(id=c.id, name=c.name, type=c.type, created_at=c.created_at.isoformat())
        for c in result.scalars()
    ]


@router.post("", response_model=CredentialResponse)
async def create_credential(
    body: CredentialCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> CredentialResponse:
    secret = settings.ENCRYPTION_KEY or settings.SECRET_KEY
    cred = Credential(
        name=body.name,
        type=body.type,
        encrypted_data=encrypt_value(json.dumps(body.data), secret),
        owner_id=user.id,
    )
    db.add(cred)
    await db.flush()
    return CredentialResponse(id=cred.id, name=cred.name, type=cred.type, created_at=cred.created_at.isoformat())


class CredentialUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    data: dict | None = None


@router.patch("/{credential_id}", response_model=CredentialResponse)
async def update_credential(
    credential_id: int, body: CredentialUpdate, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> CredentialResponse:
    result = await db.execute(
        select(Credential).where(Credential.id == credential_id, Credential.owner_id == user.id)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise NotFoundError("Credential not found")
    if body.name is not None:
        cred.name = body.name
    if body.data is not None:
        secret = settings.ENCRYPTION_KEY or settings.SECRET_KEY
        cred.encrypted_data = encrypt_value(json.dumps(body.data), secret)
    await db.flush()
    return CredentialResponse(id=cred.id, name=cred.name, type=cred.type, created_at=cred.created_at.isoformat())


@router.delete("/{credential_id}")
async def delete_credential(
    credential_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> dict:
    result = await db.execute(
        select(Credential).where(Credential.id == credential_id, Credential.owner_id == user.id)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise NotFoundError("Credential not found")
    await db.delete(cred)
    return {"deleted": True}


@router.get("/{credential_id}/meta")
async def credential_meta(
    credential_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)
) -> dict:
    """Return non-secret credential fields for auto-filling node parameters."""
    result = await db.execute(
        select(Credential).where(Credential.id == credential_id, Credential.owner_id == user.id)
    )
    cred = result.scalar_one_or_none()
    if not cred:
        raise NotFoundError("Credential not found")
    data = decrypt_credential(cred)
    safe = {k: v for k, v in data.items() if k.lower() not in ("apikey", "api_key", "password", "secret", "token", "value")}
    return {"id": cred.id, "name": cred.name, "type": cred.type, **safe}


def decrypt_credential(cred: Credential) -> dict:
    secret = settings.ENCRYPTION_KEY or settings.SECRET_KEY
    return json.loads(decrypt_value(cred.encrypted_data, secret))
