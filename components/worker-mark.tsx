type WorkerMarkProps = {
  size?: number;
  className?: string;
};

export default function WorkerMark({ size = 24, className }: WorkerMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 13L14 35L24 15L34 35L41 13"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 13H13" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" />
      <circle cx="24" cy="15" r="3.1" fill="#8FC2FF" />
    </svg>
  );
}
