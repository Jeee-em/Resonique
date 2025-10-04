import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";

export const meta = () => ([
    { title: 'Resumind | ResumeMate' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const { id } = useParams<{ id: string }>();
    const { auth, isLoading, fs, kv } = usePuterStore();
    const [imageUrl, setImageUrl] = useState<string | null>('');
    const [resumeUrl, setResumeUrl] = useState<string | null>('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            try {
                console.log('Loading resume with ID:', id);
                
                // Try both key formats to handle inconsistency
                let resume = await kv.get(`resume:${id}`);
                if (!resume) {
                    console.log('Key with colon not found, trying underscore...');
                    resume = await kv.get(`resume_${id}`);
                }

                if (!resume) {
                    console.error('Resume not found with either key format:', `resume:${id}`, `resume_${id}`);
                    return;
                }

                console.log('Raw resume data found:', resume);
                const data = JSON.parse(resume);
                console.log('Parsed resume data:', data);

                const resumeBlob = await fs.read(data.resumePath);
                if (!resumeBlob) {
                    console.error('Failed to read resume file from:', data.resumePath);
                    return;
                }

                const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
                const resumeUrl = URL.createObjectURL(pdfBlob);
                setResumeUrl(resumeUrl);
                console.log('Resume URL created');

                const imageBlob = await fs.read(data.imagePath);
                if (!imageBlob) {
                    console.error('Failed to read image file from:', data.imagePath);
                    return;
                }
                const imageUrl = URL.createObjectURL(new Blob([imageBlob], { type: 'image/png' }));
                setImageUrl(imageUrl);
                console.log('Image URL created');

                setFeedback(data.feedback);
                console.log('Feedback set:', data.feedback);
                console.log('Feedback type:', typeof data.feedback);

            } catch (error) {
                console.error('Error loading resume:', error);
            }
        };

        if (id) {
            loadResume();
        }
    }, [id, kv, fs])
    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>

            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img src={imageUrl} alt="resume image" className="w-full h-full object-contain rounded-2xl" title="resume" />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <div className="text-center">
                            <img src="/images/resume-scan-2.gif" alt="Loading..." className="w-full max-w-md mx-auto" />
                            <p className="text-gray-600 mt-4">Loading feedback...</p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Resume