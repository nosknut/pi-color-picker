import './compass.css';
let prev = 0
/* https://codepen.io/Chub/pen/eiHna */
export function CompassView({ direction }: { direction: number }) {
    const lastPrev = prev
    prev = direction
    return (
        <div className="compass">
            <div className="compass-inner">
                <div className="north">N</div>
                <div className="east">E</div>
                <div className="west">W</div>
                <div className="south">S</div>
                <div className="main-arrow" data-direction={String((direction || 0).toFixed(0)) + 'deg'} data-prev-direction={String((lastPrev || 0).toFixed(0)) + 'deg'}>
                    <div className="arrow-up" />
                    <div className="arrow-down" />
                </div>
            </div>
        </div>
    )
}