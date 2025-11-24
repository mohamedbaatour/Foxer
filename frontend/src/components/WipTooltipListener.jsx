import { useEffect } from "react";

const WipTooltipListener = () => {
    useEffect(() => {
        const tooltip = document.getElementById("wip-tooltip");
        if (!tooltip) return;

        let active = false;
        let lastTarget = null;

        const selector = ".disabled, [data-wip='true']";

        const hide = () => {
            active = false;
            tooltip.style.opacity = "0";
            tooltip.style.transform = "translate(10%, 10%) scale(0.96)";
        };

        const show = () => {
            active = true;
            tooltip.style.opacity = "1";
            tooltip.style.transform = "translate(-7%, -7%) scale(1)";
        };

        const move = (e) => {
            if (!active) return;

            const speed = Math.hypot(e.movementX, e.movementY);
            // tooltip.style.opacity = speed < 1 ? "0.65" : "1";

            tooltip.style.left = `${e.clientX + 14}px`;
            tooltip.style.top = `${e.clientY + 14}px`;
        };


        const onEsc = (e) => {
            if (e.key === "Escape") hide();
        };


        const onLeaveWindow = () => hide();

        const onPointerDown = () => hide();

        const onTouchStart = () => hide();

        const onContextMenu = () => hide();

        const onOver = (e) => {
            const t = e.target.closest(selector);
            if (!t) return;

            lastTarget = t;
            show();
        };

        const onOut = (e) => {
            if (!lastTarget) return;

            if (!e.relatedTarget || !e.relatedTarget.closest(selector)) {
                hide();
                lastTarget = null;
            }
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseover", onOver);
        document.addEventListener("mouseout", onOut);

        document.addEventListener("keydown", onEsc);
        window.addEventListener("blur", onLeaveWindow);
        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("touchstart", onTouchStart, true);
        document.addEventListener("contextmenu", onContextMenu, true);

        return () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseover", onOver);
            document.removeEventListener("mouseout", onOut);

            document.removeEventListener("keydown", onEsc);
            window.removeEventListener("blur", onLeaveWindow);
            document.removeEventListener("pointerdown", onPointerDown, true);
            document.removeEventListener("touchstart", onTouchStart, true);
            document.removeEventListener("contextmenu", onContextMenu, true);
        };
    }, []);

    return null;
};

export default WipTooltipListener;
