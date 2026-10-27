import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Tray from '../components/Tray.jsx';
import Demo from '../components/Demo.jsx';

const MotionLink = motion.create(Link);
const examples = [
  'A lighthouse on a cliff in a storm, oil painting', 'A fox asleep in fresh snow, soft morning light',
  'A neon-lit street market in the rain', 'An astronaut watering plants on a balcony',
  'A tiny village inside a giant seashell', 'A paper boat sailing through a flooded library',
  'A glass greenhouse on a mountain at dusk', 'A robot reading a bedtime story to a cat',
];
const steps = [
  ['Describe', 'Write what is in the picture. Add a negative prompt for anything you want left out.'],
  ['Tune', 'Steps, guidance and LoRA strength decide how detailed it is, how literal it is, and how strongly your trained style shows.'],
  ['Keep', 'Every print is saved to your gallery with its settings. Reuse any of them in one click, or download the file.'],
];
const headline = 'Describe a picture. Watch it develop.'.split(' ');
const group = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } };
const rise = { hidden: { y: '110%' }, show: { y: 0, transition: { type: 'spring', damping: 22, stiffness: 110 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Landing() {
  const [prompt, setPrompt] = useState('');
  const box = useRef(null);
  const nav = useNavigate();
  const pick = (t) => { setPrompt(t); box.current?.focus(); };

  const chips = (dup) => (
    <ul className={'flex ' + (dup ? 'marquee-dup' : '')} aria-hidden={dup || undefined}>
      {examples.map((t) => (
        <li key={t} className="mr-3">
          <button tabIndex={dup ? -1 : 0} onClick={() => pick(t)}
            className="whitespace-nowrap rounded-full border-2 border-ink bg-print px-4 py-2 hover:bg-safelight">{t}</button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-16">
        <motion.div variants={group} initial="hidden" animate="show">
          <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
            {headline.map((w, i) => (
              <span key={i} className="mr-[0.25em] inline-block overflow-hidden pb-1 align-bottom">
                <motion.span variants={rise} className="inline-block">{w}</motion.span>
              </span>
            ))}
          </h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-[34rem] text-lg text-mute">
            Type what you want to see. Your custom-trained model draws it, and every print is saved to your gallery.
          </motion.p>
          <motion.form variants={fadeUp} className="mt-8 max-w-[34rem]" onSubmit={(e) => { e.preventDefault(); nav('/studio', { state: { prompt } }); }}>
            <label htmlFor="p" className="mb-1 block font-medium">What should it show?</label>
            <textarea ref={box} id="p" rows={3} required maxLength={500} value={prompt} onChange={(e) => setPrompt(e.target.value)}
              className="field" placeholder="A lighthouse on a cliff in a storm, oil painting" />
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="mt-3 rounded-md bg-safelight px-6 py-3 font-bold text-ink">Develop image</motion.button>
          </motion.form>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 90, delay: 0.3 }} className="relative">
          <Tray><Demo /></Tray>
          {prompt && <p className="absolute inset-x-3 bottom-3 line-clamp-2 rounded bg-ink/85 px-3 py-2 text-print">{prompt}</p>}
        </motion.div>
      </section>

      <section aria-label="Example prompts" className="py-4">
        <p className="mb-3 font-medium">Try one of these</p>
        <div className="marquee"><div className="marquee-track">{chips(false)}{chips(true)}</div></div>
      </section>
