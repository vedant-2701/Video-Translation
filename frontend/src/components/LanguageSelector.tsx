type LanguageSelectorProps = {
    selectedLanguage: string;
    onChange: (lang: string) => void;
};

export default function LanguageSelector({
    selectedLanguage,
    onChange,
}: LanguageSelectorProps) {
    return (
        <div>
            <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700 mb-1"
            >
                Target Language
            </label>
            <select
                id="language"
                name="language"
                value={selectedLanguage}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
            >
                <option value="hindi">Hindi</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
            </select>
        </div>
    );
}
