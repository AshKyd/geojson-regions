/** How far the map can be zoomed in. 1 is the whole world. */
export const MAX_ZOOM = 12;

/**
 * Decides which input starts a pan or zoom on the map.
 * One-finger touches are ignored so a swipe over the map scrolls the page instead of
 * trapping it; panning and pinching need two fingers. Mouse drag always works.
 * The wheel only zooms with cmd/ctrl held, so scrolling the page over the map isn't hijacked.
 * Ctrl-wheel is also how trackpads report a pinch (d3's default blocks other ctrl events).
 */
export const allowsMapGesture = (event: Event) => {
	if (event.type.startsWith('touch')) {
		return (event as TouchEvent).touches.length >= 2;
	}
	if (event.type === 'wheel') {
		const { ctrlKey, metaKey } = event as WheelEvent;
		return ctrlKey || metaKey;
	}
	return !(event as MouseEvent).ctrlKey && !(event as MouseEvent).button;
};
