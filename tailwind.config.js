/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT:   '#C1522A',
          hover:     '#A8431D',
          light:     '#E07A55',
          dim:       '#FAEAE2',
          'dim-txt': '#9A4020',
        },
        sf: {
          bg:          'var(--color-sf-bg)',
          surface:     'var(--color-sf-surface)',
          'surface-2': 'var(--color-sf-surface-2)',
          border:      'var(--color-sf-border)',
          'border-2':  'var(--color-sf-border-2)',
          'text-1':    'var(--color-sf-text-1)',
          'text-2':    'var(--color-sf-text-2)',
          'text-3':    'var(--color-sf-text-3)',
        },
        ad: {
          bg:          '#211A14',
          surface:     '#2E2318',
          'surface-2': '#3D2E20',
          border:      '#4E3A28',
          'border-2':  '#5C4535',
          'text-1':    '#F0E8DC',
          'text-2':    '#C4A882',
          'text-3':    '#8C7060',
        },
        tenant: {
          primary:   'var(--tenant-primary)',
          secondary: 'var(--tenant-secondary)',
        },
        // Super Admin — deliberately its own identity, not a reskin of the
        // tenant admin's espresso "ad-*" palette or any tenant's own brand
        // color. This is the platform operator's own control room: near-black
        // slate canvas + a fixed electric-violet accent that belongs to
        // Launchly itself, never to a merchant.
        sup: {
          bg:          '#0A0B10',
          surface:     '#131420',
          'surface-2': '#1B1D2C',
          'surface-3': '#252840',
          border:      '#262838',
          'border-2':  '#363A52',
          'text-1':    '#F4F4F8',
          'text-2':    '#A3A4BC',
          'text-3':    '#6C6D87',
        },
        supa: {
          DEFAULT: '#7C6CF6',
          hover:   '#6957F0',
          light:   '#A79AFA',
          dim:     '#1C1A38',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.6' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',   { lineHeight: '2rem' }],
        '3xl':['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':['3rem',     { lineHeight: '1.15' }],
        '6xl':['3.75rem',  { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '16px',
        xl:   '24px',
        full: '9999px',
      },
      boxShadow: {
        sm:          '0 1px 3px rgba(26,16,8,0.08)',
        md:          '0 4px 16px rgba(26,16,8,0.10)',
        lg:          '0 8px 32px rgba(26,16,8,0.12)',
        'dark-sm':   '0 1px 3px rgba(0,0,0,0.4)',
        'dark-md':   '0 4px 16px rgba(0,0,0,0.5)',
        'dark-lg':   '0 8px 32px rgba(0,0,0,0.6)',
        'accent':    '0 4px 20px rgba(193,82,42,0.35)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-expo':  'cubic-bezier(0.7, 0, 0.84, 0)',
        'spring':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':   'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '220': '220ms',
        '380': '380ms',
        '600': '600ms',
      },
      letterSpacing: {
        tight:   '-0.03em',
        tighter: '-0.04em',
      },
    },
  },
  plugins: [],
};
