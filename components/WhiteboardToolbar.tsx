import React from 'react';

interface WhiteboardToolbarProps {
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isErasing: boolean;
  setIsErasing: (isErasing: boolean) => void;
  undo: () => void;
  redo: () => void;
  download: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const COLORS = ['#0f172a', '#f1f5f9', '#ef4444', '#3b82f6']; // Black, White, Red, Blue
const LINE_WIDTHS = [3, 8, 15];

const FullscreenEnterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m0 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m0 0v-4m0 4l-5-5" /></svg>;
const FullscreenExitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 4h5v5M5 20h5v-5M20 15v5h-5M9 4H4v5" /></svg>;
const EraserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 7.34L16.66 4.6A2 2 0 0015.25 4H8.75A2 2 0 007.34 4.6L4.6 7.34A2 2 0 004 8.75v6.5A2 2 0 004.6 16.66L7.34 19.4A2 2 0 008.75 20h6.5a2 2 0 001.41-.59l2.66-2.66A2 2 0 0020 15.25v-6.5a2 2 0 00-.6-1.41zM18 10l-6 6M12 10l6 6" /></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

const ToolbarButton: React.FC<{ onClick?: () => void; children: React.ReactNode; isActive?: boolean; isDisabled?: boolean; ariaLabel: string }> = ({ onClick, children, isActive = false, isDisabled = false, ariaLabel }) => (
    <button
        onClick={onClick}
        disabled={isDisabled}
        className={`p-2 rounded-full transition-colors ${
            isActive ? 'bg-indigo-200 dark:bg-indigo-700' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
        } disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label={ariaLabel}
    >
        {children}
    </button>
);


const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  strokeColor,
  setStrokeColor,
  lineWidth,
  setLineWidth,
  isFullscreen,
  toggleFullscreen,
  isErasing,
  setIsErasing,
  undo,
  redo,
  download,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="absolute top-2 right-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-2 rounded-lg shadow-lg flex flex-col items-center gap-4 z-10">
      {/* Color Palette */}
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Stroke color">
        {COLORS.map((color) => (
          <button
            key={color}
            role="radio"
            aria-checked={!isErasing && strokeColor === color}
            onClick={() => setStrokeColor(color)}
            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 border-2 ${
              !isErasing && strokeColor === color ? 'border-indigo-500 scale-110' : 'border-slate-300 dark:border-slate-600'
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Set color to ${color}`}
          />
        ))}
      </div>
      
      <div className="w-full h-px bg-slate-300 dark:bg-slate-600"></div>

      {/* Line Width */}
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Line width">
        {LINE_WIDTHS.map((width) => (
          <button
            key={width}
            role="radio"
            aria-checked={lineWidth === width}
            onClick={() => setLineWidth(width)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 border-2 ${
              lineWidth === width ? 'bg-slate-200 dark:bg-slate-600 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700 border-transparent'
            }`}
            aria-label={`Set line width to ${width} pixels`}
          >
            <div className="rounded-full bg-slate-800 dark:bg-slate-200" style={{ width: width + 2, height: width + 2 }}></div>
          </button>
        ))}
      </div>
      
      <div className="w-full h-px bg-slate-300 dark:bg-slate-600"></div>

      <div className="flex flex-col gap-2">
        <ToolbarButton onClick={() => setIsErasing(!isErasing)} isActive={isErasing} ariaLabel={isErasing ? 'Switch to pen' : 'Switch to eraser'}>
            <EraserIcon />
        </ToolbarButton>
        <ToolbarButton onClick={undo} isDisabled={!canUndo} ariaLabel="Undo">
            <UndoIcon />
        </ToolbarButton>
        <ToolbarButton onClick={redo} isDisabled={!canRedo} ariaLabel="Redo">
            <RedoIcon />
        </ToolbarButton>
      </div>

      <div className="w-full h-px bg-slate-300 dark:bg-slate-600"></div>
      
      <div className="flex flex-col gap-2">
        <ToolbarButton onClick={download} ariaLabel="Download image">
            <DownloadIcon />
        </ToolbarButton>
        <ToolbarButton onClick={toggleFullscreen} ariaLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
        </ToolbarButton>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;