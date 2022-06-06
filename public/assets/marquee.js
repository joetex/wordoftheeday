
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
        return element.offsetWidth;
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



        let parentWidth = this.getParentWidth();
        let itemWidth = this.getItemWidth(item.element) + this.options.paddingSpace;
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

    onEnterFull = (item) => {
        if (item.enterTimeout) {
            clearTimeout(item.enterTimeout);
            item.enterTimeout = 0;
        }

        this.blocked = false;

        // console.log("OnEnterFull: ", item.data.title);
        this.animLoopTimeout = setTimeout(() => {
            this.animLoop(true);
        }, 1)

    }
    onExit = (item) => {
        if (item.exitTimeout) {
            clearTimeout(item.exitTimeout);
            item.exitTimeout = 0;
        }

        // console.log("onExit: ", item.data.title);
        if (this.queue.size == 0) {
            this.animLoopTimeout = setTimeout(() => { this.animLoop() }, this.options.nextItemDelay);
        }
        if (this.inView.size > 0 && this.inView.peek(-1) == item) {
            let removedItem = this.inView.pop();
            console.log("[inView] Removed item: ", removedItem.data.title);
            this.queue.pushLeft(item);
            this.parent.removeChild(item.element);
        }

    }

    animLoop = (isFromOnEnter) => {


        if (this.animLoopTimeout != 0) {
            clearTimeout(this.animLoopTimeout);
            this.animLoopTimeout = 0;
        }

        if (this.blocked) {
            console.warn("BLOCKED");
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




        if (this.options.direction < 0) {
            this.setItemTranslation(item.element, 0);
        }
        else {
            let parentWidth = this.getParentWidth();
            let itemWidth = this.getItemWidth(item.element) + this.options.paddingSpace;
            let totalWidth = (parentWidth + itemWidth);
            this.setItemTranslation(item.element, -totalWidth)
        }

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




