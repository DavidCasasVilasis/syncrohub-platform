from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.core.database import get_session
from app.schemas.billing import BillingEstimate
from app.services.billing_service import calculate_billing

router = APIRouter(prefix="/billing", tags=["Facturación & Costes Energéticos"])


@router.get("/estimate", response_model=BillingEstimate, summary="Estimación de facturación eléctrica")
def get_billing_estimate(
    building_id: int = Query(..., description="ID del edificio"),
    days: int = Query(default=30, ge=1, le=365, description="Ventana de cálculo en días"),
    session: Session = Depends(get_session)
):
    """
    Calcula la estimación de costes eléctricos desagregados por periodos tarifarios (Punta, Llano, Valle),
    el término fijo de potencia contratada y la huella de carbono asociada.
    """
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    try:
        return calculate_billing(session, building_id, start_date, now)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
