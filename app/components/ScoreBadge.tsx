interface ScoreBadgeProps {
    score: number;
}

const ScoreBadge = ({ score }: ScoreBadgeProps) => {
    const getBadgeConfig = (score: number) => {
        if (score > 70) {
            return {
                bgColor: 'bg-green-100',
                textColor: 'text-green-600',
                label: 'Strong'
            };
        } else if (score > 49) {
            return {
                bgColor: 'bg-yellow-100',
                textColor: 'text-yellow-600',
                label: 'Good start'
            };
        } else {
            return {
                bgColor: 'bg-red-100',
                textColor: 'text-red-600',
                label: 'Needs Work'
            };
        }
    };

    const { bgColor, textColor, label } = getBadgeConfig(score);

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            <p>{label}</p>
        </div>
    );
};

export default ScoreBadge;
