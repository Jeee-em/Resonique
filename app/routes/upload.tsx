import { useState, type FormEvent } from 'react'
import Navbar from '~/components/Navbar'
import FileUploader from '~/FileUploader';
import { convertPdfToImage } from '~/lib/pdf2img';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/utils';
import {prepareInstructions, AIResponseFormat} from "../../constants";
import { useNavigate } from 'react-router';

const Upload = () => {
    const navigate = useNavigate();
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string; jobTitle: string; jobDescription: string; file: File; }) => {
        setIsProcessing(true);

        try {
            setStatusText('Uploading File...');
            const uploadedFile = await fs.upload([file]);
            if(!uploadedFile) {
                setStatusText('Failed to upload file');
                return;
            }

            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            if(!imageFile.file || imageFile.error) {
                const errorMsg = imageFile.error || 'Failed to convert PDF to image';
                console.error('PDF conversion error:', errorMsg);
                setStatusText(`Error: ${errorMsg}`);
                return;
            }

            setStatusText('Uploading the image...')
            const uploadedImage = await fs.upload([imageFile.file])
            if(!uploadedImage) {
                setStatusText('Failed to upload image');
                return;
            }

            setStatusText('Preparing data...')
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, 
                jobTitle,
                jobDescription,
                feedback: null // Will be updated after AI analysis
            }

            // Don't save yet - wait until we have the feedback

            setStatusText('Analyzing resume...');

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription, AIResponseFormat })
            )

            if(!feedback) {
                setStatusText('Error: Failed to analyze resume');
                return;
            }

            const feedbackText = typeof feedback.message.content === 'string' ? feedback.message.content : feedback.message.content[0].text;

            data.feedback = JSON.parse(feedbackText);

            // Save the complete data with feedback using consistent key format
            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analysis complete! Redirecting...');
            console.log('Final data saved:', data);
            navigate(`/resume/${uuid}`);
        } catch (error) {
            console.error('Error during analysis:', error);
            setStatusText(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        } finally {
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form: any = e.currentTarget.closest('form');

        if(!form) return;

        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" alt="Loading..." className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score</h2>
                    )}

                    {!isProcessing && (
                        <form id='upload-form' onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" id='company-name' name="company-name" placeholder='Company Name' />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" id='job-title' name="job-title" placeholder='Job Title' />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} id='job-description' name="job-description" placeholder='Job Description' />
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type='submit'>
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Upload