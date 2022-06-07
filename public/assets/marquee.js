
const defaultOptions = {
    speed: 100,
    direction: -1,
    paddingSpace: 100,
    nextItemDelay: 0,
}

class Marquee {

    constructor(id, options) {
        if (!id) {
            throw "Invalid element id for Marquee";
        }

        this.options = options || defaultOptions;
        this.options.speed = this.options.speed || 100;
        this.options.direction = this.options.direction || -1;
        this.options.paddingSpace = this.options.paddingSpace || 100;
        this.options.nextItemDelay = this.options.nextItemDelay || 500;
        this.prevSpeed = this.options.speed;

        this.parent = document.getElementById(id);

        this.animLoopTimeout = 0;

        this.blocked = false;
        this.inView = new Deque();
        this.queue = new Deque();

        // ✅ Add event listener
        document.addEventListener('visibilitychange', this.checkTabFocused);

    }


    checkTabFocused = () => {
        if (document.visibilityState === 'visible') {
            this.play();
        } else {
            this.pause();
        }
    }



    getParentWidth = () => {
        let width = this.parent.offsetWidth / 2;
        return width;
    };

    getItemWidth = (element) => {
        return Math.max(600, element.offsetWidth);
    };

    getTranslateX = (element) => {
        var style = window.getComputedStyle(element);
        var matrix = new WebKitCSSMatrix(style.transform);
        // console.log('translateX: ', matrix.m41);
        return matrix.m41;
    };

    setItemPaused = (element) => {
        var x = this.getTranslateX(element);
        this.setItemTranslation(element, x);
    }

    setItemTranslation = (element, x) => {
        element.style.transform = "translateX(" + x + "px) translateZ(0)";
        element.style.transition = 'none';
    };

    processItemTranslation = (item, shouldDoAnimLoop) => {

        if (this.options.speed == 0) {
            return;
        }

        let parentWidth = this.getParentWidth();
        let actualItemWidth = this.getItemWidth(item.element);
        let itemWidth = actualItemWidth + this.options.paddingSpace;
        let totalWidth = (parentWidth + itemWidth);


        let currentX = this.getTranslateX(item.element);
        currentX = Math.abs(currentX);
        let targetX = totalWidth;
        let exitTime = 0;
        let enterTime = 0;

        if (this.options.direction > 0) {
            targetX = 0;
            exitTime = currentX / this.options.speed;
            enterTime = (itemWidth - (totalWidth - currentX)) / this.options.speed;
        } else {
            exitTime = (targetX - currentX) / this.options.speed;
            targetX = -targetX;
            enterTime = (itemWidth - currentX) / this.options.speed;
        }

        setTimeout(() => {

            item.element.style.transform = "translateX(" + (targetX) + "px)  translateZ(0)";
            item.element.style.transition = 'transform ' + exitTime + 's linear';
        }, 1)


        // console.log("EnterTime: ", enterTime);
        let enterTimeMs = Math.abs(Math.round(enterTime * 1000));
        let exitTimeMs = Math.abs(Math.round(exitTime * 1000));


        if (shouldDoAnimLoop)
            item.enterTimeout = setTimeout(() => { this.onEnterFull(item) }, (enterTime > 0) ? enterTimeMs : 1);
        if (exitTime > 0)
            item.exitTimeout = setTimeout(() => { this.onExit(item) }, exitTimeMs);
    };

    createItem = (feedItem) => {
        let anchor = document.createElement('a');
        anchor.href = feedItem.link;
        anchor.textContent = feedItem.title;

        anchor.onclick = function (e) {

            return false;
        }

        let item = this.addItem(anchor, feedItem);
        return item;
    }

    addItem = (child, data, customClass) => {
        let element = document.createElement('li');
        element.classList.add('marquee-item');
        if (customClass)
            element.classList.add(customClass);



        element.appendChild(child);
        // this.parent.appendChild(item);
        this.queue.push({ element, data });

    }
    onEnter = (item) => {

        if (this.options.direction < 0) {
            this.setItemTranslation(item.element, 0);
        }
        else {
            let parentWidth = this.getParentWidth();
            let itemWidth = this.getItemWidth(item.element) + this.options.paddingSpace;
            let totalWidth = (parentWidth + itemWidth);
            this.setItemTranslation(item.element, -totalWidth)
        }

        setTimeout(() => {
            let itemWidth = this.getItemWidth(item.element)
            item.element.style.width = itemWidth + 'px';
        }, 1)

        setTimeout(() => {
            this.createDescription(item);
        }, 50)


    }

    createDescription = (item) => {

        let descCheck = item.element.querySelector('.marquee-item-desc-wrapper');
        if (descCheck) {
            return;
        }

        let descTemplate = document.querySelector('.template.marquee-item-desc-wrapper');
        descTemplate = descTemplate.cloneNode(true);
        descTemplate.classList.remove('template');

        let itemContent = this.sanitizeContent(item.data.content);

        let content = descTemplate.querySelector('.marquee-item-desc-content');
        content.innerHTML = itemContent;

        let images = this.extractImages(content)
        if (images.length > 0) {
            let featuredImageElem = descTemplate.querySelector(".marquee-item-desc-featuredimage");
            featuredImageElem.src = images[0];
            featuredImageElem.classList.add('active');
        }


        // let itemWidth = this.getItemWidth(item.element);


        item.element.appendChild(descTemplate);
    }

    extractImages = (content) => {

        let images = [];
        let imageElems = content.querySelectorAll('img');
        for (var i = 0; i < imageElems.length; i++) {
            let img = imageElems[i];
            images.push(img.src);
            img.parentNode.removeChild(img);
        }

        return images;
    }

    sanitizeContent = (itemContent) => {
        itemContent = itemContent.replace(/\r?\n/g, "<br />"); //convert newlines to break tags
        itemContent = itemContent.replace(/javascript\:/g, ""); //remove inline javascript
        itemContent = itemContent.replace(/\<\/?script[^\>]*/g, ""); //remove script tags
        itemContent = itemContent.replace(/\<\/?iframe[^\>]*/g, ""); //remove iframe tags
        itemContent = itemContent.replace(/on[^=]{3,10}=/g, ""); //remove inline dom events
        return itemContent;
    }

    onEnterFull = (item) => {
        if (item.enterTimeout) {
            clearTimeout(item.enterTimeout);
            item.enterTimeout = 0;
        }

        this.blocked = false;

        // console.log("OnEnterFull: ", item.data.title);
        if (this.animLoopTimeout != 0) {
            clearTimeout(this.animLoopTimeout);

        }
        this.animLoopTimeout = setTimeout(() => {
            this.animLoop(true);
        }, 1)


    }
    onExit = (item) => {
        if (item.exitTimeout) {
            clearTimeout(item.exitTimeout);
            item.exitTimeout = 0;
        }
        if (this.options.speed == 0)
            return;

        // console.log("onExit: ", item.data.title);
        if (this.queue.size == 0) {
            if (this.animLoopTimeout != 0) {
                clearTimeout(this.animLoopTimeout);

            }
            this.animLoopTimeout = setTimeout(() => {
                this.animLoop();
            }, this.options.nextItemDelay)

        }
        if (this.inView.size > 0 && this.inView.peek(-1) == item) {
            let removedItem = this.inView.pop();
            console.log("[inView] Removed item: ", removedItem.data.title);
            this.queue.pushLeft(item);
            this.parent.removeChild(item.element);
        }

    }

    animLoop = (isFromOnEnter) => {

        if (this.options.speed == 0) {
            console.warn("BLOCKED (paused)");
            return;
        }
        if (this.animLoopTimeout != 0) {
            clearTimeout(this.animLoopTimeout);
            this.animLoopTimeout = 0;
        }

        if (this.blocked) {
            console.warn("BLOCKED (busy)");
            return;
        }
        if (this.queue.size == 0) {
            console.warn("No more items in marquee");
            return;
        }
        let item = this.queue.peek(-1);
        // this.queue.push(item);
        if (!item) {
            console.warn("Invalid item in marquee");
            return;
        }

        this.blocked = true;

        console.log("[inView] Adding item: ", item.data.title);
        if (this.queue.size > 0 && this.queue.peek(-1) == item) {
            let removedItem = this.queue.pop();
            console.log("[queue] Removed item: ", removedItem.data.title);
            this.parent.appendChild(item.element);
            this.inView.pushLeft(item);
        }






        this.onEnter(item);

        this.processItemTranslation(item, true);
    }

    setPixelsPerSecond = (newSpeed) => {
        this.options.speed = newSpeed || this.options.speed;
        this.options.speed = Math.abs(this.options.speed);
        return this.options.speed;
    }

    toggleDirection = () => {
        let newDir = Number.parseInt(this.options.direction);
        if (newDir < 0) {
            this.options.direction = 1;
        } else {
            this.options.direction = -1;
        }

        this.queue.reverse();
        this.inView.reverse();

        if (this.options.speed > 0) {
            this.pause();
            setTimeout(() => { this.play(); }, 50);
        }

    }

    setDirection = (newDir) => {
        newDir = Number.parseInt(newDir);
        if (newDir < 0) {
            this.options.direction = -1;
        } else {
            this.options.direction = 1;
        }

        this.queue.reverse();
        this.inView.reverse();

        if (this.options.speed > 0) {
            this.pause();
            setTimeout(() => { this.play(); }, 50);
        }

    }

    togglePause = () => {
        if (this.options.speed == 0)
            this.play();
        else
            this.pause();
    }

    pause = () => {
        if (this.options.speed == 0)
            return;
        this.prevSpeed = this.options.speed;
        this.options.speed = 0;

        if (this.animLoopTimeout != 0) {
            clearTimeout(this.animLoopTimeout);
            this.animLoopTimeout = 0;
        }

        // let items = this.parent.querySelectorAll('.marquee-item');
        for (const item of this.inView) {
            if (item.exitTimeout) {
                clearTimeout(item.exitTimeout);
                item.exitTimeout = 0;
            }
            if (item.enterTimeout) {
                clearTimeout(item.enterTimeout);
                item.enterTimeout = 0;
            }

            this.setItemPaused(item.element);
        }

        for (const item of this.queue) {
            if (item.exitTimeout) {
                clearTimeout(item.exitTimeout);
                item.exitTimeout = 0;
            }
            if (item.enterTimeout) {
                clearTimeout(item.enterTimeout);
                item.enterTimeout = 0;
            }

        }

        // for (var i = 0; i < items.length; i++) {
        //     let item = items[i];
        //     this.setItemPaused(item);
        // }
    }

    play = () => {
        //if (prevSpeed != 0) {
        this.options.speed = this.prevSpeed;
        //}

        let i = 0;
        for (const item of this.inView) {
            this.processItemTranslation(item, i == 0);
            i++;
        }

    }
}




