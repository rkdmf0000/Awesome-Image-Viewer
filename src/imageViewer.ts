//custom types:
type image = {
    mainUrl: string;
    thumbnailUrl?: string;
    description?: string;
}
type button = {
  name: string;
  iconSrc: string;
  iconSize: string;
  onSelect: () => void;
}
type constructorParameters = {
    images: image[];
    currentSelected?: number;
    buttons?: button[];
    showThumbnails?: boolean;
    isZoomable?: boolean;
    stretchImages?: boolean;
    style?: object;
}

export default class ImageViewer{

    //object properties:
    protected viewID:          number;
    protected view:            HTMLElement;
    protected images:          image[];
    protected currentSelected: number;
    protected buttons?:        button[];
    protected showThumbnails:  boolean;
    protected isZoomable:      boolean;
    protected isInZoom:        boolean;
    protected stretchImages:   boolean;
    protected isHudShow:       boolean;
    protected dbcTimer:        any;
    protected dbcWaiting:      boolean;
    protected isSwiping:       boolean;
    protected style?:          object;

    //constructor:
    constructor(parameters:constructorParameters){

        //append CSS styles to DOM:
        ImageViewer.appendCSS();//comment at dev mode

        //the view:
        this.viewID = ImageViewer.generateViewID();
        const view  = ImageViewer.getHtml(this.viewID, this.isZoomable = parameters.isZoomable ?? true);
        document.body.appendChild(view);
        this.view   = document.getElementById(this.viewID.toString()) || document.createElement('div');

        //set properties:
        this.images          = parameters.images;
        this.currentSelected = parameters.currentSelected ?? 0;
        this.buttons         = parameters.buttons;
        this.showThumbnails  = parameters.showThumbnails  ?? true;
        this.isInZoom        = false;
        this.stretchImages   = parameters.stretchImages   ?? false;
        this.isHudShow       = true;
        this.dbcTimer        = setTimeout(()=>{}, 0);
        this.dbcWaiting      = false;
        this.isSwiping       = false;

        //show images:
        this.showImages();

        //show toolbar:
        this.showToolbar();

        //arrow event:
        this.addEventToArrows();

        //echo thumbnails:
        this.echoThumbnails();

        //select the image:
        this.selectImage(this.currentSelected);

        //swipe event:
        this.addEventToSwipe((direction) => {
            let index = this.currentSelected;
            direction === 'RIGHT' ? index-- : index++;
            this.selectImage(index);
        }, () => this.selectImage(this.currentSelected));
        
        //hud and zoom events:
        this.addEventToHudAndZoom();

        //addEventToWindowResize:
        this.addEventToWindowResize();

        //set style:
        this.setStyle(parameters.style);

        //hide events:
        this.addEventToHide();
        
        //finally show:
        this.show();

	}

    //appendCSS:
    protected static appendCSS(){
        if(document.getElementById('imageViewer-style') === null){
            const head  = document.head || document.getElementsByTagName('head')[0];
            const style = document.createElement('style');
            style.id  = 'imageViewer-style';
            head.appendChild(style);
            style.appendChild(document.createTextNode(Style));
        }
    }

    //generateViewID:
    protected static generateViewID():number{
		const id = Math.floor(Math.random() * 1000000000) + 100000000;
        const element = document.getElementById(id.toString());
        if(element === null)
            return id;
        return ImageViewer.generateViewID();
	}

    //getHtml:
    protected static getHtml(viewID:number, isZoomable:boolean):ChildNode{
        const html = `
            <div class="imageViewer" id="${viewID}">
                <div class="shadow"></div>
                <div class="container-llbede">
                    <div class="imagesWrapper"></div>
                    <button class="touchSurface"></button>
                    <div class="toolbar">
                        <button class="defaultButton closeButton" title="Close"><div><svg fill="#bfbfbf" width="21" height="21" viewBox="-1 -2 18 18" xmlns="http://www.w3.org/2000/svg"><path d="m11.2929 3.29289c.3905-.39052 1.0237-.39052 1.4142 0 .3905.39053.3905 1.02369 0 1.41422l-3.29289 3.29289 3.29289 3.2929c.3905.3905.3905 1.0237 0 1.4142s-1.0237.3905-1.4142 0l-3.2929-3.29289-3.29289 3.29289c-.39053.3905-1.02369.3905-1.41422 0-.39052-.3905-.39052-1.0237 0-1.4142l3.2929-3.2929-3.2929-3.29289c-.39052-.39053-.39052-1.02369 0-1.41422.39053-.39052 1.02369-.39052 1.41422 0l3.29289 3.2929z" fill-rule="evenodd"/></svg></div></button>
                        ${isZoomable ? `
                            <button class="defaultButton zoomOutButton" title="Zoom out"><div><svg fill="#bfbfbf" width="22" height="22" viewBox="0 -1 17 17" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.027 6.149a5.52 5.52 0 0 1-1.27 3.908l4.26 4.26-.7.71-4.26-4.27a5.52 5.52 0 1 1 1.97-4.608zm-5.45 4.888a4.51 4.51 0 0 0 3.18-1.32l-.04.02a4.51 4.51 0 0 0 1.36-3.2 4.5 4.5 0 1 0-4.5 4.5zm-2.54-4.98h5v1h-5v-1z"/></svg></div></button>
                            <button class="defaultButton zoomInButton"  title="Zoom in" ><div><svg fill="#bfbfbf" width="22" height="22" viewBox="-1 -2 35 35" xmlns="http://www.w3.org/2000/svg"><path d="m18 12h-4v-4h-2v4h-4v2h4v4h2v-4h4z"/><path d="m21.4479 20a10.856 10.856 0 0 0 2.5521-7 11 11 0 1 0 -11 11 10.856 10.856 0 0 0 7-2.5521l7.5859 7.5521 1.4141-1.4141zm-8.4479 2a9 9 0 1 1 9-9 9.01 9.01 0 0 1 -9 9z"/><path d="m0 0h32v32h-32z" fill="none"/></svg></div></button>
                        ` : ''}
                    </div>
                    <button class="arrowButton leftButton" ><div><svg fill="none" stroke="#bbb" width="22" height="22" viewBox="3 3 18 18" xmlns="http://www.w3.org/2000/svg" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><polyline points="15 18 9 12 15 6" /></svg></div></button>
                    <button class="arrowButton rightButton"><div><svg fill="none" stroke="#bbb" width="22" height="22" viewBox="3 3 18 18" xmlns="http://www.w3.org/2000/svg" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><polyline points="9 18 15 12 9 6"  /></svg></div></button>
                    <div class="footer">
                        <p dir="auto" class="description"></p>
                        <div class="thumbnailsWrapper"></div>
                    </div>
                </div>
            </div>
        `;
        return ImageViewer.getChildNode(html);
	}

    //getThumbnailHtml:
    protected static getImageHtml(imageSrc:string, stretchImages:boolean):ChildNode{
        const html = `
            <button class="imageContainer${stretchImages ? ' stretch' : ''}" data-url="${imageSrc}">
                <img class="image"/>
            </button>
        `;
        return ImageViewer.getChildNode(html);
    }

    //getButtonHtml:
    protected static getButtonHtml(name:string, iconSrc:string, iconSize:string):ChildNode{
        const html = `
            <input
                type="button"
                class="customButton"
                title="${name}"
                style="${'background-image:' + "url('" + iconSrc + "');"} ${iconSize !== '' ? ('background-size:' + iconSize + ';') : ''}"
            />`;
        return ImageViewer.getChildNode(html);
    }

    //getThumbnailHtml:
    protected static getThumbnailHtml(index:number, imageSrc:string, title?:string):ChildNode{
        const html = `
            <button class="thumbnailContainer">
                <img class="thumbnail" data-index="${index}" src="${imageSrc}" title="${title}"/>
            </button>
        `;
        return ImageViewer.getChildNode(html);
    }

    //getChildNode:
    protected static getChildNode(html:string):ChildNode{
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild || div;
    }
    
    //showImages:
    protected showImages(){
        const imagesWrapper = <HTMLElement> this.view.getElementsByClassName('imagesWrapper')[0];
        this.images.forEach((image) => {
            const imageHtml = ImageViewer.getImageHtml(image.mainUrl, this.stretchImages);
            imagesWrapper.appendChild(imageHtml);
        });
    }
    
    //showToolbar:
    protected showToolbar(){
        const toolbar = <HTMLElement> this.view.getElementsByClassName('toolbar')[0];
        this.buttons?.forEach((button) => {
            const buttonHtml = ImageViewer.getButtonHtml(button.name, button.iconSrc, button.iconSize);
            toolbar.appendChild(buttonHtml);
            buttonHtml.addEventListener('click', e => {
                e.stopPropagation();
                if(typeof button.onSelect !== undefined)
                    button.onSelect();
            })
        });
    }

    //addEventToArrows:
    protected addEventToArrows(){
        const leftButton = <HTMLElement> this.view.getElementsByClassName('leftButton')[0];
        const rightButton = <HTMLElement> this.view.getElementsByClassName('rightButton')[0];
        
        //if there is only one image, ignore all:
        if(this.images.length === 1){
            leftButton.style.display = 'none';
            rightButton.style.display = 'none';
            return;
        }

        //click event to buttons:
        leftButton.addEventListener('click', e => {
            e.stopPropagation();
            this.selectImage(this.currentSelected - 1);
        });
        rightButton.addEventListener('click', e => {
            e.stopPropagation();
            this.selectImage(this.currentSelected + 1);
        });

        //navigation with arrow buttons:
        const elements = this.view.querySelectorAll('.touchSurface, .imageContainer, .arrowButton, .thumbnailContainer');
        const firstElement = <HTMLElement> elements[0];
        setTimeout(() => firstElement.focus(), 100);
        elements.forEach(element => {
            element.addEventListener('keydown', e => {
                const event  = <KeyboardEvent> e;
                if(event.key === 'ArrowLeft'){
                    e.preventDefault();
                    this.selectImage(this.currentSelected - 1);
                }
                if(event.key === 'ArrowRight'){
                    e.preventDefault();
                    this.selectImage(this.currentSelected + 1);
                }
                });
        });
    }
    
    //echoThumbnails:
    protected echoThumbnails(){
        if(!this.showThumbnails || this.images.length <= 1) return;//if there is only one image, ignore all
        const thumbnailsWrapper = <HTMLElement> this.view.getElementsByClassName('thumbnailsWrapper')[0];
        let i = 0;
        this.images.forEach((image) => {
            const thumbnailHtml = ImageViewer.getThumbnailHtml(i, image.thumbnailUrl ?? image.mainUrl, image.description);
            thumbnailsWrapper.appendChild(thumbnailHtml);
            thumbnailHtml.addEventListener('click', e => {
                e.stopPropagation();
                const tar = <HTMLHtmlElement> e.target;
                const index = tar.dataset.index;
                this.selectImage(parseInt(index ?? '0'));
            });
            i++;
        });
    }

    //selectImage:
    protected selectImage(index:number){
        if(index < 0 || index > this.images.length - 1 || this.isInZoom) return;
        this.currentSelected = index;
        this.loadImage(index-1);
        this.loadImage(index);
        this.loadImage(index+1);
        this.scrollToImage(index);
        this.setDescription(this.images[index].description);
        this.setThumbnail(index);
    }

    //loadImage:
    protected loadImage(index:number){
        if(index < 0 || index > this.images.length - 1) return;
        const imagesWrapper = <HTMLElement> this.view.getElementsByClassName('imagesWrapper')[0];
        const imageContainers = imagesWrapper.children;
        const imageContainer = <HTMLElement> imageContainers.item(index);
        const url = imageContainer.dataset.url;
        const image = <HTMLImageElement> imageContainer.getElementsByClassName('image')[0];
        image.src = url!;
    }

    //scrollToImage:
    protected scrollToImage(index:number){
        const imagesWrapper = <HTMLElement> this.view.getElementsByClassName('imagesWrapper')[0];
        const imageContainers = imagesWrapper.children;
        const imageContainer = <HTMLElement> imageContainers.item(index);
        const imageCenterPosition = imageContainer.offsetLeft - (imagesWrapper.getBoundingClientRect().width - imageContainer.getBoundingClientRect().width)/2;
        imagesWrapper.scrollTo({left: imageCenterPosition, behavior: 'smooth'});
    }

    //setDescription:
    protected setDescription(text?:string){
        const description = <HTMLElement> this.view.getElementsByClassName('description')[0];
        description.innerHTML = text || '';
    }

    //setThumbnail:
    protected setThumbnail(index:number){
        const thumbnails = this.view.querySelectorAll('.thumbnail');
        thumbnails.forEach(th => {
            th.classList.remove('selected');
        });
        const thumbnail = <HTMLElement> this.view.querySelector('[data-index="' + index + '"]');
        if(thumbnail !== null){
            thumbnail.classList!.add('selected');
            this.scrollThumbnail(index);
        }
    }

    //scrollThumbnail:
    protected scrollThumbnail(index:number){
        const thumbnailsWrapper = <HTMLElement> this.view.getElementsByClassName('thumbnailsWrapper')[0];
        const thumbnails = thumbnailsWrapper.children;
        const thumbnail = <HTMLElement> thumbnails.item(index);
        const thumbnailCenterPosition = thumbnail.offsetLeft - (thumbnailsWrapper.getBoundingClientRect().width - thumbnail.getBoundingClientRect().width)/2;
        thumbnailsWrapper.scrollTo({left: thumbnailCenterPosition, behavior: 'smooth'});
    }

    //onSwipe:
    protected addEventToSwipe(onSwipe:(direction:string)=>void, notSwiped:()=>void){
        let swipeDetection = { startX: 0, startY: 0, endX: 0, endY: 0 };
        let minX = 30; //min x swipe for horizontal swipe
        let maxX = 30; //max x difference for vertical swipe
        let minY = 50; //min y swipe for vertical swipe
        let maxY = 60; //max y difference for horizontal swipe
        let direction = '';
        const imagesWrapper = <HTMLElement> this.view.getElementsByClassName('imagesWrapper')[0];
        let wrapperInfo = imagesWrapper.getBoundingClientRect();
        let scrollPosition = wrapperInfo.left;
        //events:
        const touchSurface = <HTMLElement> this.view.getElementsByClassName('touchSurface')[0];
        touchSurface.addEventListener('touchstart', e => {
            if(this.isInZoom) return;
            let touch = e.touches[0];
            swipeDetection.startX = touch.screenX;
            swipeDetection.startY = touch.screenY;
            const imagesWrapper = <HTMLElement> this.view.getElementsByClassName('imagesWrapper')[0];
            const images = imagesWrapper.children;
            const currentImage = <HTMLElement> images.item(this.currentSelected);
            scrollPosition = currentImage.offsetLeft;
        });
        touchSurface.addEventListener('touchmove', e => {
            if(this.isInZoom) return;
            e.preventDefault();
            let touch = e.touches[0];
            swipeDetection.endX = touch.screenX;
            swipeDetection.endY = touch.screenY;
            //sync the scroll with touch:
            let touchChange = swipeDetection.startX - touch.screenX;
            imagesWrapper.scrollLeft = scrollPosition + touchChange;
        });
        touchSurface.addEventListener('touchend', e => {
            if(this.isInZoom) return;
            //horizontal detection:
            if(
                (((swipeDetection.endX - minX > swipeDetection.startX) || (swipeDetection.endX + minX < swipeDetection.startX)) &&
                 ((swipeDetection.endY < swipeDetection.startY + maxY) && (swipeDetection.startY > swipeDetection.endY - maxY)  &&
                  (swipeDetection.endX > 0)))){
                if(swipeDetection.endX > swipeDetection.startX)
                    direction = 'RIGHT'; else direction = 'LEFT';
            }
            //vertical detection:
            else if(
                (((swipeDetection.endY - minY > swipeDetection.startY) || (swipeDetection.endY + minY < swipeDetection.startY)) &&
                 ((swipeDetection.endX < swipeDetection.startX + maxX) && (swipeDetection.startX > swipeDetection.endX - maxX)  &&
                  (swipeDetection.endY > 0)))){
                if(swipeDetection.endY > swipeDetection.startY)
                    direction = 'DOWN'; else direction = 'UP';
            }

            //run the callback:
            if(direction === '') notSwiped();
            else onSwipe(direction);
            swipeDetection = { startX: 0, startY: 0, endX: 0, endY: 0 };
            direction = '';
            scrollPosition = wrapperInfo.left;
        });
    }

    //addEventToHudAndZoom:
    protected addEventToHudAndZoom(){
        const touchAndImages = this.view.querySelectorAll('.touchSurface, .image');
        touchAndImages.forEach(element => {
            element.addEventListener('click', e => {
                e.stopPropagation();
                if(!this.dbcWaiting){
                    this.dbcWaiting = true;
                    this.dbcTimer = setTimeout(() => {
                        //single click:
                        if(this.dbcWaiting)
                            this.flipHud(!this.isHudShow);
                        this.dbcWaiting = false;
                    }, 200);
                }else{
                    //double click:
                    clearTimeout(this.dbcTimer);
                    this.dbcWaiting = false;
                    this.flipZoom((<MouseEvent> e).clientX, (<MouseEvent> e).clientY);
                }
            });
        });

        //zoom button:
        const zoomButtons = this.view.querySelectorAll('.zoomInButton, .zoomOutButton');
        zoomButtons.forEach(button => {
            button.addEventListener('click', e => {
                e.stopPropagation();
                const imagesWrapper = <HTMLElement> this.view.getElementsByClassName('imagesWrapper')[0];
                const imageContainers = imagesWrapper.children;
                const imageContainer = <HTMLElement> imageContainers.item(this.currentSelected);
                this.flipZoom(imageContainer.offsetWidth/2, imageContainer.offsetHeight/2);
            });
        });

        //prevent scroll on zoom:
        const imagesWrapper = <HTMLElement> this.view.getElementsByClassName('imagesWrapper')[0];
        imagesWrapper.addEventListener('touchmove', e => {
            if(this.isInZoom)
                imagesWrapper.style.overflow = 'hidden';
            else
                imagesWrapper.style.overflow = 'scroll';
        });

    }

    //flipZoom:
    protected flipZoom(clickX:number, clickY:number){
        if(!this.isZoomable) return;
        const imagesWrapper = <HTMLElement> this.view.getElementsByClassName('imagesWrapper')[0];
        const imageContainers = imagesWrapper.children;
        const imageContainer = <HTMLElement> imageContainers.item(this.currentSelected);
        const touchSurface = <HTMLElement> this.view.getElementsByClassName('touchSurface')[0];
        if(!imageContainer.classList.contains('zoom')){
            imageContainer.classList.add('zoom');
            const image = <HTMLElement> imageContainer.getElementsByClassName('image')[0];
            imageContainer!.scrollTop = (image.offsetHeight / 2) - (imageContainer.offsetHeight / 2) + (clickY - (imageContainer.offsetHeight / 2))*(image.offsetHeight/imageContainer.offsetHeight);
            imageContainer!.scrollLeft = (image.offsetWidth / 2) - (imageContainer.offsetWidth / 2) + (clickX - (imageContainer.offsetWidth / 2))*(image.offsetWidth/imageContainer.offsetWidth);
            this.isInZoom = true;
            this.flipHud(false);
            this.view.classList.add('halfHud');
            touchSurface.style.display = 'none';
        }else{
            imageContainer.classList.remove('zoom');
            this.isInZoom = false;
            this.flipHud(true);
            this.view.classList.remove('halfHud');
            touchSurface.style.display = 'block';
        }
    }

    //flipHud:
    protected flipHud(show:boolean){
        if(show){
            this.view.classList.remove('hudDisplay');
            setTimeout(()=>this.view.classList.remove('hudOpacity'), 50);
        }else{
            this.view.classList.add('hudOpacity');
            setTimeout(()=>this.view.classList.add('hudDisplay'), 200);
        }
        this.isHudShow = show;
    }

    //addEventToWindowResize:
    protected addEventToWindowResize(){
        window.addEventListener('resize', () => {
            this.selectImage(this.currentSelected);
        });
    }

    //setStyle:
    public setStyle(style?:object){
        if(style === undefined) return;
        this.style = style;
        for(const [className, style] of Object.entries(this.style)){
            const elements = this.view.querySelectorAll('.' + className);
            elements.forEach(element => {
                for(const property of style)
                    (<HTMLElement> element).style.setProperty(property[0], property[1]);
            });
        }
    }

    //show:
    protected show(){
        const thisView = this;
        setTimeout(() => {
            thisView.view.classList.add('visible');
        }, 50);//slight delay between adding to DOM and running css animation
    }

    //addEventToHide:
    protected addEventToHide(){
        const closeButton = this.view.getElementsByClassName('closeButton')[0];
        closeButton.addEventListener('click', e => {
            this.hide();
        });
    }

    //hide:
    public hide(){
        this.view.classList.remove('visible');
        const thisView = this;
        setTimeout(() => {
            thisView.view.remove();
        }, 500);//long enough to make sure that it is hidden
    }

}

const Style = `
@media (hover: hover) and (pointer: fine) {
    .thinScrollbar::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    .thinScrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .thinScrollbar::-webkit-scrollbar-thumb {
      background: #bbb;
      border-radius: 20px;
    }
    .darkMode .thinScrollbar::-webkit-scrollbar-thumb {
      background: #555;
    }
  }
  .hiddenScrollbar, .imageViewer > .container-llbede > .footer > .thumbnailsWrapper, .imageViewer > .container-llbede > .imagesWrapper > .imageContainer, .imageViewer > .container-llbede > .imagesWrapper {
    scrollbar-width: none;
  }
  
  .hiddenScrollbar::-webkit-scrollbar, .imageViewer > .container-llbede > .footer > .thumbnailsWrapper::-webkit-scrollbar, .imageViewer > .container-llbede > .imagesWrapper > .imageContainer::-webkit-scrollbar, .imageViewer > .container-llbede > .imagesWrapper::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
  
  .transparentBackground {
    transition: background-color 50ms;
  }
  
  .transparentBackground:enabled:active {
    background-color: rgba(0, 0, 0, 0.05) !important;
  }
  
  @media (hover: hover) and (pointer: fine) {
    .transparentBackground {
      transition: background-color 150ms;
    }
    .transparentBackground:enabled:hover {
      background-color: rgba(0, 0, 0, 0.03) !important;
    }
    .transparentBackground:enabled:focus {
      background-color: rgba(0, 0, 0, 0.04) !important;
    }
    .transparentBackground:enabled:active {
      background-color: rgba(0, 0, 0, 0.08) !important;
    }
  }
  .transparentBackground:disabled {
    opacity: 0.5;
    cursor: default;
  }
  
  .darkTransparentBackground, .imageViewer > .container-llbede > .arrowButton, .imageViewer > .container-llbede > .toolbar > .defaultButton,
  .imageViewer > .container-llbede > .toolbar > .customButton {
    transition: background-color 50ms;
  }
  
  .darkTransparentBackground:enabled:active, .imageViewer > .container-llbede > .arrowButton:enabled:active, .imageViewer > .container-llbede > .toolbar > .defaultButton:enabled:active,
  .imageViewer > .container-llbede > .toolbar > .customButton:enabled:active {
    background-color: rgba(0, 0, 0, 0.4) !important;
  }
  
  @media (hover: hover) and (pointer: fine) {
    .darkTransparentBackground, .imageViewer > .container-llbede > .arrowButton, .imageViewer > .container-llbede > .toolbar > .defaultButton,
  .imageViewer > .container-llbede > .toolbar > .customButton {
      transition: background-color 150ms;
    }
    .darkTransparentBackground:enabled:hover, .imageViewer > .container-llbede > .arrowButton:enabled:hover, .imageViewer > .container-llbede > .toolbar > .defaultButton:enabled:hover,
  .imageViewer > .container-llbede > .toolbar > .customButton:enabled:hover {
      background-color: rgba(0, 0, 0, 0.2) !important;
    }
    .darkTransparentBackground:enabled:focus, .imageViewer > .container-llbede > .arrowButton:enabled:focus, .imageViewer > .container-llbede > .toolbar > .defaultButton:enabled:focus,
  .imageViewer > .container-llbede > .toolbar > .customButton:enabled:focus {
      background-color: rgba(0, 0, 0, 0.3) !important;
    }
    .darkTransparentBackground:enabled:active, .imageViewer > .container-llbede > .arrowButton:enabled:active, .imageViewer > .container-llbede > .toolbar > .defaultButton:enabled:active,
  .imageViewer > .container-llbede > .toolbar > .customButton:enabled:active {
      background-color: rgba(0, 0, 0, 0.4) !important;
    }
  }
  .darkTransparentBackground:disabled, .imageViewer > .container-llbede > .arrowButton:disabled, .imageViewer > .container-llbede > .toolbar > .defaultButton:disabled,
  .imageViewer > .container-llbede > .toolbar > .customButton:disabled {
    opacity: 0.5;
    cursor: default;
  }
  
  .coloredBackground {
    opacity: 0.8;
  }
  
  .coloredBackground:enabled:active {
    opacity: 1;
  }
  
  @media (hover: hover) and (pointer: fine) {
    .coloredBackground:enabled:hover {
      opacity: 0.85;
    }
    .coloredBackground:enabled:focus {
      opacity: 0.9;
    }
    .coloredBackground:enabled:active {
      opacity: 1;
    }
  }
  .coloredBackground:disabled {
    opacity: 0.5;
    cursor: default;
  }
  
  .transparentBackground_dark {
    transition: background-color 50ms;
  }
  
  .transparentBackground_dark:enabled:active {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
  
  @media (hover: hover) and (pointer: fine) {
    .transparentBackground_dark {
      transition: background-color 150ms;
    }
    .transparentBackground_dark:enabled:hover {
      background-color: rgba(255, 255, 255, 0.12) !important;
    }
    .transparentBackground_dark:enabled:focus {
      background-color: rgba(255, 255, 255, 0.1) !important;
    }
    .transparentBackground_dark:enabled:active {
      background-color: rgba(255, 255, 255, 0.07) !important;
    }
  }
  .imageViewer {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    visibility: hidden;
    z-index: 999999993;
  }
  .imageViewer * {
    padding: 0;
    margin: 0;
    font-family: Catamaran-Medium;
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }
  .imageViewer a::-moz-focus-inner,
  .imageViewer input::-moz-focus-inner,
  .imageViewer button::-moz-focus-inner {
    border: 0;
    padding: 0;
  }
  .imageViewer a {
    text-decoration: none;
    outline: none;
  }
  .imageViewer input, .imageViewer button, .imageViewer select {
    border: none;
    outline: none;
  }
  .imageViewer input[type=button], .imageViewer button, .imageViewer select {
    cursor: pointer;
  }
  .imageViewer input:required,
  .imageViewer input:invalid {
    box-shadow: none;
  }
  .imageViewer input[type=button], .imageViewer button {
    font-size: 1rem;
    padding: 0;
    background: none;
  }
  .imageViewer > .shadow {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    opacity: 0;
    transition: opacity 160ms ease-in-out;
  }
  .imageViewer > .container-llbede {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
  .imageViewer > .container-llbede > .imagesWrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    gap: 100px;
    overflow: hidden;
  }
  .imageViewer > .container-llbede > .imagesWrapper > .imageContainer {
    min-width: 100%;
    min-height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-x: scroll;
    overflow-y: scroll;
    position: relative;
    cursor: default;
  }
  .imageViewer > .container-llbede > .imagesWrapper > .imageContainer > .image {
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: 100%;
    cursor: pointer;
  }
  .imageViewer > .container-llbede > .imagesWrapper .stretch > .image {
    width: 100%;
    height: 100%;
    -o-object-fit: contain;
       object-fit: contain;
  }
  .imageViewer > .container-llbede > .imagesWrapper .zoom {
    display: inline;
  }
  .imageViewer > .container-llbede > .imagesWrapper .zoom > .image {
    max-width: unset;
    max-height: unset;
    margin-bottom: -20px;
  }
  .imageViewer > .container-llbede > .touchSurface {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
  .imageViewer > .container-llbede-llbede > .toolbar {
    width: 55px;
    height: auto;
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
  }
  .imageViewer > .container-llbede > .toolbar > * {
    transition: opacity 200ms ease-in-out;
  }
  .imageViewer > .container-llbede > .toolbar > .defaultButton,
  .imageViewer > .container-llbede > .toolbar > .customButton {
    width: 100%;
    height: 55px;
    display: flex;
  }
  .imageViewer > .container-llbede > .toolbar > .defaultButton {
    justify-content: center;
    align-items: center;
  }
  .imageViewer > .container-llbede > .toolbar > .defaultButton > div {
    width: -webkit-fit-content;
    width: -moz-fit-content;
    width: fit-content;
    height: -webkit-fit-content;
    height: -moz-fit-content;
    height: fit-content;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .imageViewer > .container-llbede > .toolbar > .zoomOutButton {
    display: none;
  }
  .imageViewer > .container-llbede > .toolbar > .customButton {
    background-size: 19px auto;
    background-repeat: no-repeat;
    background-position: center center;
  }
  .imageViewer > .container-llbede > .arrowButton {
    width: 80px;
    height: calc(100% - 300px);
    min-height: 100px;
    max-height: 160px;
    display: flex;
    color: #aaa;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 50%;
    transform: translate(0, -50%);
    transition: opacity 200ms ease-in-out;
  }
  .imageViewer > .container-llbede > .arrowButton > div {
    width: -webkit-fit-content;
    width: -moz-fit-content;
    width: fit-content;
    height: -webkit-fit-content;
    height: -moz-fit-content;
    height: fit-content;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .imageViewer > .container-llbede > .leftButton {
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
    left: 0;
  }
  .imageViewer > .container-llbede > .rightButton {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    right: 0;
  }
  .imageViewer > .container-llbede > .footer {
    width: auto;
    max-width: 85%;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    left: 50%;
    bottom: 20px;
    transform: translate(-50%, 0);
    gap: 8px;
    transition: opacity 200ms ease-in-out;
  }
  .imageViewer > .container-llbede > .footer > .description {
    padding: 2px 10px;
    background-color: rgba(0, 0, 0, 0.7);
    font-size: 1.2rem;
    color: #fafafa;
    border-radius: 2px;
  }
  .imageViewer > .container-llbede > .footer > .description:empty {
    display: none;
  }
  .imageViewer > .container-llbede > .footer > .thumbnailsWrapper:empty {
    display: none;
  }
  .imageViewer > .container-llbede > .footer > .thumbnailsWrapper {
    max-width: 100%;
    padding-left: 10px;
    padding-right: 10px;
    height: 80px;
    overflow: scroll;
    display: flex;
    gap: 12px;
  }
  .imageViewer > .container-llbede > .footer > .thumbnailsWrapper > .thumbnailContainer > .thumbnail {
    width: auto;
    max-width: 120px;
    height: auto;
    max-height: 70px;
    border: solid 3px transparent;
    border-radius: 3px;
    cursor: pointer;
  }
  .imageViewer > .container-llbede > .footer > .thumbnailsWrapper > .thumbnailContainer > .selected {
    border-color: white;
  }
  
  .imageViewer.hudOpacity > .container-llbede > .toolbar > *,
  .imageViewer.hudOpacity > .container-llbede > .arrowButton,
  .imageViewer.hudOpacity > .container-llbede > .footer {
    opacity: 0;
  }
  
  .imageViewer.hudDisplay > .container-llbede > .toolbar > *,
  .imageViewer.hudDisplay > .container-llbede > .arrowButton,
  .imageViewer.hudDisplay > .container-llbede > .footer {
    display: none;
  }
  
  .imageViewer.halfHud > .container-llbede > .toolbar > .closeButton,
  .imageViewer.halfHud > .container-llbede > .toolbar > .zoomOutButton {
    opacity: 1;
    display: flex;
  }
  .imageViewer.halfHud > .container-llbede > .toolbar > .zoomInButton {
    opacity: 0;
    display: none;
  }
  
  .imageViewer.visible {
    visibility: visible;
  }
  .imageViewer.visible > .shadow,
  .imageViewer.visible > .container-llbede {
    opacity: 1;
  }
  
  @media (max-width: 450px) {
    .imageViewer > .container-llbede > .toolbar {
      width: auto;
      height: 50px;
      flex-direction: row-reverse;
    }
    .imageViewer > .container-llbede > .toolbar > .defaultButton,
  .imageViewer > .container-llbede > .toolbar > .customButton {
      width: 50px;
      height: 100%;
    }
    .imageViewer > .container-llbede > .arrowButton {
      width: 65px;
    }
    .imageViewer > .container-llbede > .footer > .description {
      font-size: 1rem;
    }
  }
  @media (orientation: landscape) and (max-height: 450px) {
    .imageViewer > .container-llbede > .toolbar {
      width: auto;
      height: 50px;
      flex-direction: row-reverse;
    }
    .imageViewer > .container-llbede > .toolbar > .defaultButton,
  .imageViewer > .container-llbede > .toolbar > .customButton {
      width: 50px;
      height: 100%;
    }
    .imageViewer > .container-llbede > .footer {
      bottom: 5px;
    }
  }
`;
