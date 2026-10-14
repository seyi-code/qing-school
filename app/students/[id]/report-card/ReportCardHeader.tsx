export function ReportCardHeader({
  logoUrl,
  schoolName,
  motto,
  address,
  phones,
  email,
  termLabel,
  photoUrl,
  studentName,
}: {
  logoUrl: string;
  schoolName: string;
  motto?: string | null;
  address: string;
  phones: string;
  email: string;
  termLabel: string;
  photoUrl?: string | null;
  studentName: string;
}) {
  return (
    <header className="rc-header">
      <div className="rc-header-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="rc-logo" />
        <div className="rc-header-mid">
          <div className="rc-school">{schoolName}</div>
          {motto ? <div className="rc-motto">{motto}</div> : null}
          <p className="rc-contact">
            {address}
            {phones ? (
              <>
                <br />
                Tel: {phones}
              </>
            ) : null}
            {email ? (
              <>
                <br />
                {email}
              </>
            ) : null}
          </p>
        </div>
        <div className="rc-photo-box">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={studentName} />
          ) : (
            <span className="rc-photo-placeholder">
              Student
              <br />
              photo
            </span>
          )}
        </div>
      </div>
      <p className="rc-doc-title">{termLabel}</p>
    </header>
  );
}
