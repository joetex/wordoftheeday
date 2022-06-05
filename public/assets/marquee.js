

function Marquee(id, speed) {
    if (!id) {
        throw "Invalid element id for Marquee";
    }

    speed = speed || 50;
    let prevSpeed = speed;

    const parent = document.getElementById(id);

    let inView = [];
    let queue = new Deque();

    return {
        addItem: (child, customClass) => {
            let item = document.createElement('li');
            item.classList.push('marquee-item');
            if (customClass)
                item.classList.push(customClass);

            item.appendChild(child);
            parent.appendChild(item);
            queue.push(item);
        },

        updateSpeed: (newSpeed) => {
            speed = newSpeed || speed;
        },

        updateDirection: (newDir) => {
            newDir = Number.parseInt(newDir);
            prevSpeed = speed;
            if (newDir < 0) {
                speed = -Math.abs(speed);
            } else {
                speed = Math.abs(speed);
            }
        },

        pause: () => {
            if (speed == 0)
                return;
            prevSpeed = speed;
            speed = 0;
        },

        play: () => {
            if (prevSpeed != 0) {
                speed = prevSpeed;
            }
        }
    }


}

const createItem = (feedItem) => {
    let anchor = document.createElement('a');
    anchor.href = feedItem.link;
    anchor.textContent = feedItem.title;

    return item;
}