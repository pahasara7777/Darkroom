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
