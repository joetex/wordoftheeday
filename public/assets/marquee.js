
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

        this.paused = false;
        this.dragging = false;
        this.mousedown = false;

        this.xStart = 0;
        this.xPrev = 0;
        this.xOffset = 0;

        this.parent = document.getElementById(id);

        this.animLoopTimeout = 0;

        this.blocked = false;
        this.inView = new Deque();
        this.queue = new Deque();

        // ✅ Add event listener
        document.addEventListener('visibilitychange', this.checkTabFocused);

    }


    checkTabFocused = () => {
        if (document.visibilityState === 'visible' && !this.paused) {
            this.play(true);
        } else {
            this.pause(true);
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
        // item.prevX = this.getTranslateX(element);
        element.style.transform = "translateX(" + x + "px) translateZ(0)";
        element.style.transition = 'none';

    };

    processDragItems = () => {
        for (const item of this.inView) {
            this.processDragItemTranslation(item);
        }
    }

    processDragItemTranslation = (item) => {

        let parentWidth = this.getParentWidth();
        let actualItemWidth = this.getItemWidth(item.element);
        let itemWidth = actualItemWidth + this.options.paddingSpace;
        let totalWidth = (parentWidth + itemWidth);


        let currentX = this.getTranslateX(item.element);
        currentX = Math.abs(currentX);
        let targetX = currentX + this.xOffset;


        this.setItemTranslation(item.element, -targetX);




        if (this.xOffset < 0) {
            if (targetX <= (totalWidth - itemWidth) && item.state == 'enter') {
                this.onEnterFull(item);
            }
            else if (targetX <= 0) {
                this.onExit(item);
            }
            else if (targetX > (totalWidth - itemWidth) && item.state == 'enterfull') {
                item.state = 'enter';
            }
        } else if (this.xOffset > 0) {
            if (targetX >= itemWidth && item.state == 'enter') {
                this.onEnterFull(item);
            }
            else if (targetX >= totalWidth) {
                this.onExit(item);
            }
            else if (targetX < itemWidth && item.state == 'enterfull') {
                item.state = 'enter';
            }
        }




    };


    processItemTranslation = (item, shouldDoAnimLoop) => {

        if (this.options.speed == 0 || this.dragging) {
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

        item.prevX = currentX;

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


        if (shouldDoAnimLoop) {
            if (item.enterTimeout) {
                clearTimeout(item.enterTimeout);
            }
            item.enterTimeout = setTimeout(() => { this.onEnterFull(item) }, (enterTime > 0) ? enterTimeMs : 1);
        }
        if (exitTime > 0) {
            if (item.exitTimeout) {
                clearTimeout(item.exitTimeout);
            }
            item.exitTimeout = setTimeout(() => { this.onExit(item) }, exitTimeMs);
        }
    };


    onEnter = (item) => {

        if (this.options.direction < 0 || (this.dragging && this.xOffset > 0)) {
            this.setItemTranslation(item.element, 0);
        }
        else if (this.options.direction > 0 || (this.dragging && this.xOffset < 0)) {
            let parentWidth = this.getParentWidth();
            let itemWidth = this.getItemWidth(item.element) + this.options.paddingSpace;
            let totalWidth = (parentWidth + itemWidth);
            this.setItemTranslation(item.element, -totalWidth)
        }

        // setTimeout(() => {
        let itemWidth = this.getItemWidth(item.element)
        item.element.style.width = itemWidth + 'px';
        // }, 1)
        item.state = 'enter';

        // setTimeout(() => {
        //     this.createDescription(item);
        // }, 1)

    }

    onEnterFull = (item) => {
        if (item.enterTimeout) {
            clearTimeout(item.enterTimeout);
            item.enterTimeout = 0;
        }

        item.state = 'enterfull';
        this.blocked = false;

        if (!this.dragging) {
            // console.log("OnEnterFull: ", item.data.title);
            this.animLoop(true);
        }
        else {
            let index = this.inView.indexOf(item);
            if (index == 0)
                this.animLoop(true);
        }
    }

    onExit = (item) => {
        item.state = 'exit';

        if (this.options.speed == 0)
            return;


        // console.log("onExit: ", item.data.title);
        if (!this.dragging) {
            if (this.queue.size == 0) {
                if (this.animLoopTimeout != 0)
                    clearTimeout(this.animLoopTimeout);
                this.animLoopTimeout = setTimeout(() => { this.animLoop(); }, this.options.nextItemDelay)
            }
        }
        else {
            let areAllInside = true;
            for (const i of this.inView) {
                if (i.state == 'enter') {
                    areAllInside = false; break;
                }
            }

            if (areAllInside)
                this.animLoop();
        }

        if (this.inView.size > 0 && this.inView.peek(-1) == item) {
            let removedItem = this.inView.pop();
            // console.log("[inView] Removed item: ", removedItem.data.title);

            let descElem = item.element.querySelector('.marquee-item-desc-wrapper');
            if (descElem) {
                descElem.classList.remove('active');
                item.element.querySelector('a').classList.remove('active');
            }

            this.queue.pushLeft(item);
            if (!this.parent.contains(item.element)) {
                console.log("item missing from parent")

            }
            else
                this.parent.removeChild(item.element);
        }

    }

    animLoop = (isFromOnEnter) => {

        if (this.options.speed == 0 && !this.dragging) {
            // console.warn("BLOCKED (paused)");
            return;
        }
        if (this.animLoopTimeout != 0) {
            clearTimeout(this.animLoopTimeout);
            this.animLoopTimeout = 0;
        }

        if (this.blocked) {
            // console.warn("BLOCKED (busy)");
            return;
        }
        if (this.queue.size == 0) {
            // console.warn("No more items in marquee");
            return;
        }

        // if (!this.dragging) {
        //block subsequent calls for now
        this.blocked = true;
        // }


        //get next item to display in marquee
        let item = this.queue.peek(-1);
        if (!item) {
            console.warn("Invalid item in marquee");
            return;
        }

        //add the item to the marquee and move to inView list
        item = this.queue.pop();
        this.parent.appendChild(item.element);
        this.inView.pushLeft(item);


        //trigger onEnter event
        this.onEnter(item);

        //process animation
        this.processItemTranslation(item, true);
    }

    createItem = (feedItem) => {
        let anchor = document.createElement('a');
        anchor.href = feedItem.link;
        anchor.textContent = feedItem.title;

        var item = this.addItem(anchor, feedItem);
        var $this = this;


        anchor.onclick = function (e) {
            let descElem = e.target.parentNode.querySelector('.marquee-item-desc-wrapper');
            if (!descElem) {
                return false;
            }

            return false;
        }

        anchor.onmouseenter = function (e) {

            if (!item) {
                for (const i of $this.inView) {
                    if (i.element = e.target.parentNode) {
                        item = i;
                        break;
                    }
                }

                if (!item) {
                    console.error("Item not found");
                }
            }

            // let descElem = e.target.parentNode.querySelector('.marquee-item-desc-wrapper');
            // if (!descElem) {
            //     descElem = $this.createDescription(item);
            // }

            item.element.classList.add('active');
            // e.target.classList.add('active');
            // descElem.classList.add('active');
        }

        anchor.onmouseleave = function (e) {

            // let descElem = e.target.parentNode.querySelector('.marquee-item-desc-wrapper');
            // if (!descElem) {
            //     return;
            // }
            item.element.classList.remove('active');
            // e.target.classList.remove('active');
            // descElem.classList.remove('active');
        }


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
        return descTemplate;
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
        itemContent = itemContent.replace(/\r?\n/g, ""); //convert newlines to break tags
        itemContent = itemContent.replace(/\<br ?\/?\>/g, ""); //convert newlines to break tags
        itemContent = itemContent.replace(/\<a[^\>]*\>.*<\/a\>/g, ""); //convert newlines to break tags
        itemContent = itemContent.replace(/javascript\:/g, ""); //remove inline javascript
        itemContent = itemContent.replace(/\<\/?script[^\>]*/g, ""); //remove script tags
        itemContent = itemContent.replace(/\<\/?iframe[^\>]*/g, ""); //remove iframe tags
        itemContent = itemContent.replace(/on[^=]{3,10}=/g, ""); //remove inline dom events
        return itemContent;
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

        let prevDirection = this.options.direction;

        if (newDir < 0) {
            this.options.direction = -1;
        } else {
            this.options.direction = 1;
        }

        if (prevDirection != this.options.direction) {
            this.queue.reverse();
            this.inView.reverse();
        }


        if (this.options.speed > 0 && !this.dragging) {
            this.pause();
            setTimeout(() => { this.play(); }, 1);
        }

    }

    togglePause = () => {
        if (this.options.speed == 0)
            this.play();
        else
            this.pause();
    }

    pause = (isSystemTriggered) => {
        if (this.options.speed == 0)
            return;
        this.prevSpeed = this.options.speed;
        this.options.speed = 0;


        if (!isSystemTriggered) {
            this.paused = true;
        }
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

    play = (isSystemTriggered) => {
        //if (prevSpeed != 0) {
        if (this.options.speed > 0) {
            return;
        }

        this.options.speed = this.prevSpeed;
        //}
        if (!isSystemTriggered) {
            this.paused = false;
        }

        let i = 0;
        for (const item of this.inView) {
            this.processItemTranslation(item, i == 0);
            i++;
        }

    }


    startDrag = (e) => {

        this.mousedown = true;
        this.xStart = e.clientX;
        this.xPrev = e.clientX;
        this.prevDirection = this.options.direction;
        // this.pause(true);
    }

    drag = (e) => {
        if (!this.mousedown) {
            return;
        }

        let diff = Math.abs(this.xStart - e.clientX);
        if (diff > 10) {
            this.dragging = true;
        }

        if (!this.dragging) {
            return;
        }


        this.xOffset = (this.xPrev - e.clientX);
        this.xPrev = e.clientX;

        this.setDirection(-this.xOffset);
        // console.log("xOffset = ", this.xOffset);
        this.processDragItems();
        // console.log(e);
    }

    endDrag = (e) => {

        if (!this.dragging)
            return;

        this.setDirection(this.prevDirection);

        this.dragging = false;
        this.mousedown = false;

        let i = 0;
        for (const item of this.inView) {
            this.processItemTranslation(item, i == 0);
            i++;
        }



    }
}




