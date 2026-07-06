"""Katalog funnel sales B2B R-LEGS.

Hardcoded 1:1 dengan STAGE_FLOW + USERS_ROLE di frontend r-legs-tracking, dan
diselaraskan dengan alur resmi "Improvement Flow Ideal OBL - SDA BUD" (F0-F5,
gerbang GO/NO GO di Project Assessment, dan gerbang Nego Pelanggan sebelum
KB/Setara -> SPPBJ/SP3MK -> KL -> Delivery -> BAST -> BASO).

Ini sengaja bukan tabel database: fase, step, urutan, dan role penanggung
jawab adalah bagian tetap dari proses bisnis R-LEGS, bukan sesuatu yang admin
konfigurasi bebas lewat API (itu sebabnya CRUD ReviewLevel yang lama dihapus).
"""

from dataclasses import dataclass, field

from app.models.enums import DocumentStatus, FunnelPhase, FunnelStepCode, UserRole

DEFAULT_SLA_HOURS = 48
WARNING_SLA_HOURS = 24


@dataclass(frozen=True)
class FunnelPhaseDef:
    phase: FunnelPhase
    name: str
    description: str


@dataclass(frozen=True)
class FunnelStepDef:
    code: FunnelStepCode
    name: str
    phase: FunnelPhase
    sequence: int
    responsible_roles: tuple[UserRole, ...]
    # Kalau True: keputusan REJECT di step ini membatalkan seluruh project (-> P9 / NO GO),
    # sesuai gerbang GO/NO GO (Project Assessment) & gerbang Nego Pelanggan (SPPBJ) di diagram.
    # Kalau False: REJECT berarti "butuh revisi" (status Revision), project tetap jalan di step yang sama.
    is_cancellation_gate: bool = False


FUNNEL_PHASES: list[FunnelPhaseDef] = [
    FunnelPhaseDef(FunnelPhase.F0, "Lead", "Pendataan awal peluang bisnis."),
    FunnelPhaseDef(FunnelPhase.F1, "Opportunity", "Penyaringan & kualifikasi proyek."),
    FunnelPhaseDef(
        FunnelPhase.F2,
        "Self Assessment & Solman",
        "Penyusunan rencana kebutuhan & integrasi DigiReview/MyTens (P1-P7, SPH, SKM).",
    ),
    FunnelPhaseDef(
        FunnelPhase.F3,
        "Project Assessment",
        "Penilaian kelayakan teknis & finansial oleh SDA (gerbang GO/NO GO).",
    ),
    FunnelPhaseDef(
        FunnelPhase.F4,
        "Negosiasi",
        "Submit proposal ke customer & kesepakatan komersial (gerbang Nego Pelanggan, SPPBJ/SP3MK).",
    ),
    FunnelPhaseDef(
        FunnelPhase.F5,
        "Win & Eksekusi",
        "Penandatanganan Kontrak Layanan, delivery, dan serah terima proyek.",
    ),
]

FUNNEL_STEPS: list[FunnelStepDef] = [
    FunnelStepDef(FunnelStepCode.P1, "Justkeb Barang/Jasa (P1)", FunnelPhase.F2, 1, (UserRole.AM,)),
    FunnelStepDef(FunnelStepCode.P2, "Evaluasi Bakal Calon Mitra (P2)", FunnelPhase.F2, 2, (UserRole.BUD,)),
    FunnelStepDef(FunnelStepCode.P3, "Permintaan Harga (P3)", FunnelPhase.F2, 3, (UserRole.BUD,)),
    FunnelStepDef(FunnelStepCode.P4, "Rapat Penjelasan (P4)", FunnelPhase.F2, 4, (UserRole.BUD,)),
    FunnelStepDef(FunnelStepCode.SPH, "Surat Penawaran Harga (SPH)", FunnelPhase.F2, 5, (UserRole.BUD, UserRole.AM)),
    FunnelStepDef(FunnelStepCode.P5, "Evaluasi Harga (P5)", FunnelPhase.F2, 6, (UserRole.BUD,)),
    FunnelStepDef(FunnelStepCode.P6, "Klarifikasi & Nego (P6)", FunnelPhase.F2, 7, (UserRole.AM,)),
    FunnelStepDef(FunnelStepCode.P7, "Surat Penetapan Calon Mitra (P7)", FunnelPhase.F2, 8, (UserRole.BUD,)),
    FunnelStepDef(FunnelStepCode.SKM, "Surat Kesanggupan Mitra (SKM)", FunnelPhase.F2, 9, (UserRole.BUD, UserRole.AM)),
    FunnelStepDef(
        FunnelStepCode.PA,
        "Project Assessment (GO/NO GO)",
        FunnelPhase.F3,
        10,
        (UserRole.SDA,),
        is_cancellation_gate=True,
    ),
    FunnelStepDef(
        FunnelStepCode.SPPBJ,
        "SPPBJ / SP3MK",
        FunnelPhase.F4,
        11,
        (UserRole.BUD,),
        is_cancellation_gate=True,
    ),
    FunnelStepDef(FunnelStepCode.KL, "Kontrak Layanan (KL)", FunnelPhase.F5, 12, (UserRole.LEGAL,)),
    FunnelStepDef(FunnelStepCode.BAST, "Berita Acara Serah Terima (BAST)", FunnelPhase.F5, 13, (UserRole.AM,)),
    FunnelStepDef(FunnelStepCode.BASO, "Berita Acara Siap Operasi (BASO)", FunnelPhase.F5, 14, (UserRole.AM,)),
]

FUNNEL_STEP_BY_CODE: dict[FunnelStepCode, FunnelStepDef] = {step.code: step for step in FUNNEL_STEPS}
FUNNEL_STEP_ORDER: list[FunnelStepCode] = [step.code for step in FUNNEL_STEPS]
FUNNEL_PHASE_BY_CODE: dict[FunnelPhase, FunnelPhaseDef] = {phase.phase: phase for phase in FUNNEL_PHASES}

FIRST_STEP = FUNNEL_STEP_ORDER[0]  # P1, titik masuk begitu project lolos F0/F1 dan mulai F2.


def next_step(code: FunnelStepCode) -> FunnelStepCode | None:
    """Step berikutnya dalam urutan funnel, atau None kalau `code` sudah step terakhir (BASO)."""
    index = FUNNEL_STEP_ORDER.index(code)
    if index + 1 < len(FUNNEL_STEP_ORDER):
        return FUNNEL_STEP_ORDER[index + 1]
    return None


def is_future_step(current_step: FunnelStepCode | None, step_code: FunnelStepCode) -> bool:
    """Tiru isFutureStep() frontend: step terkunci kalau urutannya di depan current_step."""
    if current_step is None or current_step == FunnelStepCode.P9:
        return True
    return FUNNEL_STEP_ORDER.index(step_code) > FUNNEL_STEP_ORDER.index(current_step)


def primary_role_for_step(step_code: FunnelStepCode) -> UserRole:
    """Role utama yang jadi kustodian default (penanggung jawab eksekusi) untuk step ini."""
    return FUNNEL_STEP_BY_CODE[step_code].responsible_roles[0]


def can_role_act_on_step(role: UserRole, step_code: FunnelStepCode) -> bool:
    """Tiru hasRightToApprove() frontend: MANAGER cuma memantau, tidak pernah approve."""
    if role == UserRole.MANAGER:
        return False
    if step_code == FunnelStepCode.P9:
        return False
    return role in FUNNEL_STEP_BY_CODE[step_code].responsible_roles


def default_document_status_for(step_code: FunnelStepCode, is_current_step: bool) -> DocumentStatus:
    return DocumentStatus.PENDING if is_current_step else DocumentStatus.EMPTY
