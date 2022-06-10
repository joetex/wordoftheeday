
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

        this.showcontent = false;
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

        document.addEventListener('resize', (e) => {
            this.pause(true);
            setTimeout(() => { this.play(true) }, 50)
        });

        let marqueeElem = this.parent;

        marqueeElem.ondblclick = (e) => {
            this.togglePause();
        }

        marqueeElem.parentNode.querySelector('.marquee-header').ondblclick = (e) => {
            this.showcontent = !this.showcontent;

            if (this.showcontent) {
                this.parent.parentNode.classList.add('active');
            }
            else {
                this.parent.parentNode.classList.remove('active');
            }
            for (var item of this.inView) {
                if (this.showcontent)
                    this.showDescription(item);
                else
                    this.hideDescription(item);
            }
        }
        marqueeElem.addEventListener('mousedown', (e) => {
            this.startDrag(e.clientX);
        })
        marqueeElem.addEventListener('mousemove', (e) => {
            this.drag(e.clientX);
        })
        marqueeElem.addEventListener('mouseup', (e) => {
            this.endDrag(e.clientX);
        })


        marqueeElem.addEventListener('touchstart', (e) => {
            var touchobj = e.changedTouches[0];
            this.startDrag(touchobj.clientX);
        })
        marqueeElem.addEventListener('touchmove', (e) => {
            var touchobj = e.changedTouches[0];
            this.drag(touchobj.clientX);
        })
        marqueeElem.addEventListener('touchend', (e) => {
            var touchobj = e.changedTouches[0];
            this.endDrag(touchobj.clientX);
        })

        document.addEventListener('mouseup', (e) => {
            this.endDrag(e.clientX);
        })
        document.addEventListener('mousemove', (e) => {
            this.drag(e.clientX);
            e.stopPropagation();
            e.preventDefault();
        })

        document.addEventListener('touchend', (e) => {
            var touchobj = e.changedTouches[0];
            this.endDrag(touchobj.clientX);
        })
        document.addEventListener('touchmove', (e) => {
            var touchobj = e.changedTouches[0];
            this.drag(touchobj.clientX);
            e.stopPropagation();
            e.preventDefault();
        })
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
        return Math.max(400, element.offsetWidth);
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



        //drag to the right
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
        }
        //drag to the left
        else if (this.xOffset > 0) {
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

        //animate to the left
        if (this.options.direction > 0) {
            targetX = 0;
            exitTime = currentX / this.options.speed;
            enterTime = (itemWidth - (totalWidth - currentX)) / this.options.speed;
        }
        //animate to the right
        else {
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



        setTimeout(() => {

        }, 1)

        setTimeout(() => {

            let itemWidth = this.getItemWidth(item.element)
            item.element.style.width = itemWidth + 'px';

            if (this.options.direction < 0 || (this.dragging && this.xOffset > 0)) {
                this.setItemTranslation(item.element, 0);
            }
            else if (this.options.direction > 0 || (this.dragging && this.xOffset < 0)) {
                let parentWidth = this.getParentWidth();
                let itemWidth = this.getItemWidth(item.element) + this.options.paddingSpace;
                let totalWidth = (parentWidth + itemWidth);
                this.setItemTranslation(item.element, -totalWidth)
            }
        }, 1)
        item.state = 'enter';

        // console.log("[OnEnter]:", this.options.direction, item.data.title);

        if (this.showcontent)
            this.showDescription(item);

    }

    onEnterFull = (item) => {
        if (item.enterTimeout) {
            clearTimeout(item.enterTimeout);
            item.enterTimeout = 0;
        }

        item.state = 'enterfull';
        this.blocked = false;

        if (!this.dragging) {

            this.animLoop(true);
        }
        else {
            let index = this.inView.indexOf(item);
            // console.log("OnEnterFull: ", this.options.direction, item.data.title);
            if (index == 0)
                this.animLoop(true);
        }
    }

    onExit = (item) => {
        item.state = 'exit';

        // if (this.options.speed == 0)
        //     return;


        // console.log("[OnExit]:", this.options.direction, item.data.title);

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

            if (!this.showcontent)
                this.hideDescription(item);

            if (!item.dirty) {
                this.queue.pushLeft(item);

                //pushes seen items to back of the list for next feed reload
                item.data.iteration = (item.data.iteration || 1) - 1;
            }

            if (!this.parent.contains(item.element)) {
                console.log("item missing from parent")
            }
            else
                this.parent.removeChild(item.element);
        }

    }

    start = () => {
        this.animLoop();
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

        anchor.onclick = (e) => {
            let descElem = e.target.parentNode.querySelector('.marquee-item-desc-wrapper');
            if (!descElem)
                return false;

            if (!$this.dragging) {
                return true;
            }
            return false;
        }

        item.element.onmouseenter = (e) => {
            $this.showDescription(item);
        }

        item.element.onmouseleave = (e) => {
            if (!this.showcontent)
                $this.hideDescription(item);
        }

        return item;
    }



    loadItems = (feedItems) => {
        for (var i = 0; i < feedItems.length; i++) {
            this.createItem(feedItems[i]);
        }
    }
    reloadItems = (feedItems) => {

        this.queue.clear();
        for (var i = 0; i < this.inView.length; i++) {
            let item = this.inView[i];
            item.dirty = true;
        }

        this.loadItems(feedItems);
    }

    addItem = (child, data, customClass) => {
        let element = document.createElement('li');
        element.classList.add('marquee-item');
        if (customClass)
            element.classList.add(customClass);

        element.appendChild(child);

        let item = { element, data };
        this.queue.push(item);
        return item;
    }

    showDescription = (item) => {
        let descElem = item.element.querySelector('.marquee-item-desc-wrapper');
        if (!descElem) {
            setTimeout(() => {
                this.createDescription(item);
                this.updateItemDate(item);
            }, 1);
        }
        else {
            this.updateItemDate(item);
        }

        // setTimeout(() => {
        item.element.classList.add('active');
        // this.updateItemDate(item);
        // }, 20);
    }

    hideDescription = (item) => {
        item.element.classList.remove('active');
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


        if ((!itemContent || itemContent.length == 0) && images.length == 0) {
            content.remove();
        }

        let sourceElem = descTemplate.querySelector('.marquee-item-source a.marquee-item-source-page');
        let commentsElem = descTemplate.querySelector('.marquee-item-source a.marquee-item-source-comments');
        // let gotoAnchorElem = descTemplate.querySelector('.marquee-item-goto a');





        sourceElem.href = "https://" + item.data.srcDomain;
        sourceElem.textContent = item.data.srcDomain;

        if (!item.data.comments) {
            commentsElem.style.display = 'none';
        } else {
            commentsElem.style.display = 'block';
            commentsElem.href = item.data.comments;
        }

        sourceElem.onclick = (e) => !this.dragging
        commentsElem.onclick = (e) => !this.dragging
        // let owner = item.data.owner || item.data.srcDomain;
        // gotoAnchorElem.href = item.data.link;
        // gotoAnchorElem.textContent = 'Read Article';

        // let itemWidth = this.getItemWidth(item.element);
        // this.updateItemDate(item);

        item.element.appendChild(descTemplate);
        return descTemplate;
    }

    updateItemDate = (item) => {
        try {
            let descCheck = item.element.querySelector('.marquee-item-desc-wrapper');
            if (!descCheck) {
                this.createDescription(item);
                return;
            }

            let dateElem = descCheck.querySelector('.marquee-item-date');
            let dateText = 'no date available';
            let attemptDate = item.data.isoDate || item.data.pubDate;
            let pubDate = (new Date(attemptDate)).getTime();
            let todayDate = (new Date()).getTime();

            let fullDateText = (new Date(attemptDate)).toLocaleTimeString('en-US');

            let diff = todayDate - pubDate;
            diff = Math.ceil(diff / 1000); //remove ms

            let minute = 60;
            let hour = minute * 60;
            let day = hour * 24;

            if (diff < minute * 30) {
                fullDateText = '&#128293; ' + fullDateText;
                dateText = '&#128293; just now';
            }
            else if (diff < hour) {
                fullDateText = '&#128293; ' + fullDateText;
                dateText = '&#128293; less than hour ago';
            }
            else if (diff < day) {
                let hours = Math.floor(diff / hour);
                dateText = hours + (hours > 1 ? ' hours' : ' hour') + ' ago'
            }
            else if (diff >= day) {
                let days = Math.floor(diff / day);
                dateText = days + (days > 1 ? ' days' : ' day') + ' ago';
                fullDateText = (new Date(attemptDate)).toLocaleTimeString('en-US');
            }

            dateElem.innerHTML = dateText;
            dateElem.onmouseenter = (e) => { dateElem.innerHTML = fullDateText };
            dateElem.onmouseleave = (e) => { dateElem.innerHTML = dateText };
        }
        catch (e) {
            console.error(e);
        }

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
        if (!itemContent) { return '' }
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

        if (newDir == 0)
            return;

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

    clearAllTimeouts = () => {
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
    }

    pause = (isSystemTriggered) => {
        if (this.options.speed == 0)
            return;
        this.prevSpeed = this.options.speed;
        this.options.speed = 0;


        if (!isSystemTriggered) {
            this.paused = true;
        }


        this.clearAllTimeouts();
        setTimeout(() => {
            this.endDrag();
        }, 1)
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


    startDrag = (x) => {

        this.mousedown = true;
        this.xStart = x;
        this.xPrev = x;
        this.prevDirection = this.options.direction;
        // this.pause(true);
    }

    drag = (x) => {
        if (!this.mousedown) {
            return;
        }

        let diff = Math.abs(this.xStart - x);
        if (diff > 10) {
            if (!this.dragging) {
                this.clearAllTimeouts();
            }
            this.dragging = true;
        }

        if (!this.dragging) {
            return;
        }




        this.xOffset = (this.xPrev - x);
        this.xPrev = x;

        this.setDirection(-this.xOffset);
        // console.log("xOffset = ", this.xOffset);
        this.processDragItems();
        // console.log(e);
    }

    endDrag = (e) => {

        let prevDragging = this.dragging;

        setTimeout(() => {
            this.dragging = false;
            this.mousedown = false;

            if (prevDragging) {
                let i = 0;
                for (const item of this.inView) {
                    this.processItemTranslation(item, i == 0);
                    i++;
                }
            }

        }, 1)






    }
}




