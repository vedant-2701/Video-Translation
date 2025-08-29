type ProgressBarProps = {
    progress: number;
};

export default function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
                className="bg-brand-secondary h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
}
