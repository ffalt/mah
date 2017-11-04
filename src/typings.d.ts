/* SystemJS module definition */
declare var module: NodeModule;

interface NodeModule {
	id: string;
}

interface DocEx extends Document {
	exitFullscreen: () => void;
	mozCancelFullScreen: () => void;
	webkitExitFullscreen: () => void;
	fullScreen: boolean;
	fullscreen: boolean;
	mozFullScreen: boolean;
	webkitIsFullScreen: boolean;
}

interface ElemEx extends HTMLElement {
	requestFullscreen: () => void;
	webkitRequestFullScreen: () => void;
	mozRequestFullScreen: () => void;
}

interface HTMLImageElementExt extends HTMLImageElement {
	readyState: string;
}
