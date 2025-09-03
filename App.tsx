/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateStyledImage } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import Footer from './components/Footer';

const PHOTO_STYLE_CATEGORIES = {
    'Portraits & Close-ups': [
        { name: 'Smiling Portrait', prompt: 'A portrait of the person from the original photo, but they are smiling warmly at the camera. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Laughing Portrait', prompt: 'A portrait of the person from the original photo, captured mid-laugh, looking genuinely happy. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Serious Close-up', prompt: 'A dramatic close-up shot focusing on the person\'s face, with a serious and confident expression. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Thoughtful Look', prompt: 'A three-quarter portrait of the person from the original photo, but they are looking thoughtfully away from the camera, into the distance. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Side Profile', prompt: 'A portrait of the person from the original photo taken from a side profile angle. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Head Tilt', prompt: 'A portrait of the person from the original photo, with their head tilted slightly, showing a curious and engaging expression. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Playful Wink', prompt: 'A close-up portrait of the person from the original photo giving a playful wink to the camera. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Soft Smile', prompt: 'A portrait of the person from the original photo with a soft, gentle, closed-mouth smile. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ],
    'Full & Medium Shots': [
        { name: 'Confident Full Body', prompt: 'A full-body shot of the person from the original photo, showing their complete outfit. They should be standing in a relaxed but confident pose. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Walking Pose', prompt: 'A full-body shot of the person from the original photo, captured as if they are walking confidently. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Hands in Pockets', prompt: 'A medium shot of the person from the original photo, standing casually with their hands in their pockets. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Arms Crossed', prompt: 'A medium shot of the person from the original photo, with their arms crossed confidently, looking directly at the camera. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Hand on Hip', prompt: 'A three-quarter shot of the person from the original photo with one hand placed confidently on their hip. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Leaning Pose', prompt: 'A full-body shot of the person from the original photo, leaning casually against an unseen object, looking relaxed. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Looking Down', prompt: 'A medium shot of the person from the original photo looking down with a gentle, introspective expression. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ],
    'Dynamic & Candid': [
        { name: 'Dynamic Pose', prompt: 'A photo of the person from the original photo in a more dynamic or active pose, like turning, walking, or interacting with the environment. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Candid Moment', prompt: 'A candid-style photo of the person from the original photo, as if they were captured in a natural, unposed moment, perhaps adjusting their clothing or hair. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Looking Over Shoulder', prompt: 'A photo of the person from the original photo, looking back over their shoulder at the camera with a slight smile. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Hair in Motion', prompt: 'A dynamic photo of the person from the original photo where their hair is in motion, as if caught in a gentle breeze or during a turn. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Adjusting Jacket', prompt: 'A candid-style photo of the person from the original photo in the middle of adjusting their jacket, collar, or sleeve. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
        { name: 'Hand Towards Camera', prompt: 'A dynamic photo where the person from the original photo is reaching one hand out towards the camera in a friendly, inviting gesture. Maintain the exact same background, clothing, lighting, and overall style as the original image.' },
    ]
};

const ALL_PHOTO_STYLES = Object.values(PHOTO_STYLE_CATEGORIES).flat();

// Pre-defined animations for intro
const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];


type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";
const chipButtonClasses = "text-sm text-center text-neutral-300 bg-neutral-800 border-2 border-transparent py-2 px-4 rounded-lg transition-all duration-200 hover:bg-neutral-700";
const selectedChipButtonClasses = "bg-teal-600 border-teal-500 text-white font-bold";


const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded' | 'generating' | 'results-shown'>('idle');
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');


    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({}); // Clear previous results
                setSelectedStyles([]);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleStyleSelection = (styleName: string) => {
        setSelectedStyles(prev =>
            prev.includes(styleName)
                ? prev.filter(name => name !== styleName)
                : [...prev, styleName]
        );
    };

    const handleSelectAll = () => {
        setSelectedStyles(ALL_PHOTO_STYLES.map(s => s.name));
    };

    const handleClearSelection = () => {
        setSelectedStyles([]);
    };


    const handleGenerateClick = async () => {
        if (!uploadedImage || selectedStyles.length === 0) return;

        setIsLoading(true);
        setAppState('generating');
        
        const stylesToGenerate = ALL_PHOTO_STYLES.filter(style => selectedStyles.includes(style.name));

        const initialImages: Record<string, GeneratedImage> = {};
        stylesToGenerate.forEach(style => {
            initialImages[style.name] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 2;
        const stylesQueue = [...stylesToGenerate];

        const processStyle = async (style: { name: string, prompt: string }) => {
            try {
                const resultUrl = await generateStyledImage(uploadedImage, style.prompt);
                setGeneratedImages(prev => ({
                    ...prev,
                    [style.name]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [style.name]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for ${style.name}:`, err);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (stylesQueue.length > 0) {
                const style = stylesQueue.shift();
                if (style) {
                    await processStyle(style);
                }
            }
        });

        await Promise.all(workers);

        setIsLoading(false);
        setAppState('results-shown');
    };

    const handleRegeneratePhoto = async (photoName: string) => {
        if (!uploadedImage) return;

        if (generatedImages[photoName]?.status === 'pending') {
            return;
        }
        
        const style = ALL_PHOTO_STYLES.find(s => s.name === photoName);
        if (!style) {
            console.error(`Style "${photoName}" not found.`);
            return;
        }

        console.log(`Regenerating image for ${photoName}...`);

        setGeneratedImages(prev => ({
            ...prev,
            [photoName]: { status: 'pending' },
        }));

        try {
            const resultUrl = await generateStyledImage(uploadedImage, style.prompt);
            setGeneratedImages(prev => ({
                ...prev,
                [photoName]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [photoName]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${photoName}:`, err);
        }
    };
    
    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages({});
        setSelectedStyles([]);
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (photoName: string) => {
        const image = generatedImages[photoName];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            const safeFileName = photoName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            link.download = `ai-photoshoot-${safeFileName}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [name, image]) => {
                    acc[name] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length === 0) {
                alert("No images have been generated yet.");
                return;
            }

            if (Object.keys(imageData).length < selectedStyles.length) {
                alert("Please wait for all selected images to finish generating before downloading the album.");
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'ai-photoshoot-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 pb-24 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>
            
            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className="text-center mb-10">
                    <h1 className="text-6xl md:text-8xl font-caveat font-bold text-neutral-100">AI Photoshoot</h1>
                    <p className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide">Generate a stunning photo album from a single image.</p>
                </div>

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        {/* Ghost polaroids for intro animation */}
                        {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                             <motion.div
                                key={index}
                                className="absolute w-80 h-[26rem] rounded-md p-4 bg-neutral-100/10 blur-sm"
                                initial={config.initial}
                                animate={{
                                    x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{
                                    ...config.transition,
                                    ease: "circOut",
                                    duration: 2,
                                }}
                            />
                        ))}
                        <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 2, duration: 0.8, type: 'spring' }}
                             className="flex flex-col items-center"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                 <PolaroidCard 
                                     caption="Click to begin"
                                     status="done"
                                 />
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <p className="mt-8 font-permanent-marker text-neutral-500 text-center max-w-xs text-lg">
                                Click the polaroid to upload your photo and create your own virtual photoshoot.
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                     <motion.div 
                        className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full max-w-6xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Left side: Image Preview */}
                        <div className="w-full md:w-1/3 flex-shrink-0 flex justify-center flex-col items-center gap-4">
                            <h2 className="text-3xl font-caveat text-white">1) Your Photo</h2>
                             <PolaroidCard
                                imageUrl={uploadedImage}
                                caption="Original"
                                status="done"
                             />
                        </div>
                
                        {/* Right side: Configuration Panel */}
                        <div className="w-full md:w-2/3 bg-neutral-900/50 border border-neutral-700 rounded-lg p-6 backdrop-blur-sm">
                            <h2 className="text-3xl font-caveat text-white mb-2">2) Customize Your Photoshoot</h2>
                            <p className="text-neutral-400 mb-6">Select the types of photos you'd like to generate.</p>
                
                            <div className="flex justify-end gap-4 mb-4 border-b border-neutral-800 pb-4">
                                 <button onClick={handleSelectAll} className="text-sm font-semibold text-teal-400 hover:text-white transition-colors">Select All</button>
                                 <button onClick={handleClearSelection} className="text-sm font-semibold text-teal-400 hover:text-white transition-colors">Clear Selection</button>
                            </div>
                
                            <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2">
                                {Object.entries(PHOTO_STYLE_CATEGORIES).map(([category, styles]) => (
                                    <div key={category}>
                                        <h3 className="text-lg font-bold text-neutral-300 mb-3">{category}</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {styles.map(style => (
                                                <button
                                                    key={style.name}
                                                    onClick={() => toggleStyleSelection(style.name)}
                                                    className={`${chipButtonClasses} ${selectedStyles.includes(style.name) ? selectedChipButtonClasses : ''}`}
                                                >
                                                    {style.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                
                            <div className="mt-8 border-t border-neutral-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <button onClick={handleReset} className={secondaryButtonClasses}>
                                    Start Over
                                </button>
                                <button
                                    onClick={handleGenerateClick}
                                    className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    disabled={selectedStyles.length === 0}
                                >
                                    Generate ({selectedStyles.length})
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        <div ref={dragAreaRef} className="w-full max-w-7xl flex-1 overflow-y-auto mt-4 p-4 relative">
                            <div className="flex flex-wrap justify-center items-start gap-8">
                                {ALL_PHOTO_STYLES
                                    .filter(style => generatedImages[style.name])
                                    .map((style, index) => (
                                        <motion.div
                                            key={style.name}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 }}
                                        >
                                            <PolaroidCard
                                                dragConstraintsRef={dragAreaRef}
                                                caption={style.name}
                                                status={generatedImages[style.name]?.status || 'pending'}
                                                imageUrl={generatedImages[style.name]?.url}
                                                error={generatedImages[style.name]?.error}
                                                onShake={handleRegeneratePhoto}
                                                onDownload={handleDownloadIndividualImage}
                                                isMobile={isMobile}
                                            />
                                        </motion.div>
                                ))}
                            </div>
                        </div>
                         <div className="h-20 mt-4 flex items-center justify-center z-20">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button 
                                        onClick={handleDownloadAlbum} 
                                        disabled={isDownloading} 
                                        className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? 'Creating Album...' : 'Download Album'}
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        Start Over
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </main>
    );
}

export default App;