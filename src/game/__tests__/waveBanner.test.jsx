import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WaveBanner } from '../../components/Overlays';

describe('US-0005 inter-round banner', () => {
  it('renders "Nächste Runde N+1!" with ceil-seconds countdown', () => {
    const html = renderToStaticMarkup(
      <WaveBanner currentWave={1} remainingMs={7000} />
    );
    expect(html).toContain('Nächste Runde 2!');
    expect(html).toContain('>7<');
  });

  it('rounds partial seconds up', () => {
    const html = renderToStaticMarkup(
      <WaveBanner currentWave={2} remainingMs={7300} />
    );
    expect(html).toContain('Nächste Runde 3!');
    expect(html).toContain('>8<');
  });

  it('shows 0 when time is up', () => {
    const html = renderToStaticMarkup(
      <WaveBanner currentWave={5} remainingMs={0} />
    );
    expect(html).toContain('Nächste Runde 6!');
    expect(html).toContain('>0<');
  });
});
