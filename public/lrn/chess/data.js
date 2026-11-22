/* lrn — The Long Game: content data (positions are checked by the engine). */
(function (root) {
  'use strict';
  const D = {};

  /* Paul Morphy vs Duke Karl of Brunswick & Count Isouard, Paris Opera, 1858 */
  D.opera = ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5', 'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#'];

  D.pieces = {
    k: { name: 'King', val: '∞', line: 'One square in any direction. Slow, precious and, in the endgame, a fighter.', fact: 'The game ends when it cannot escape attack. It is never actually captured.' },
    q: { name: 'Queen', val: '9', line: 'Any distance in a straight line or diagonal. A rook and a bishop in one body.', fact: 'Until about 1475 she could move only one square diagonally. The new “mad queen’s chess” spread from Spain within decades.' },
    r: { name: 'Rook', val: '5', line: 'Any distance along ranks and files. Loves open files and the seventh rank.', fact: 'Its name comes from the Persian rukh, a chariot. The castle shape came later.' },
    b: { name: 'Bishop', val: '3', line: 'Any distance diagonally. Lives its whole life on one colour.', fact: 'A pair of bishops working together is usually worth a little more than two knights.' },
    n: { name: 'Knight', val: '3', line: 'An L: two squares one way, one square sideways. The only piece that jumps.', fact: 'A knight in the middle reaches eight squares; in a corner, only two. “A knight on the rim is dim.”' },
    p: { name: 'Pawn', val: '1', line: 'Forward one square (two on its first move). Captures one square diagonally forward.', fact: 'Reach the far side and it becomes any piece you like, nearly always a queen. Philidor called pawns “the soul of chess”.' }
  };

  /* ── openings ── */
  D.openings = [
    {
      id: 'italian', name: 'Italian Game', eco: 'C50', side: 'White', style: 'Classical, calm, perfect first opening',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'O-O'],
      notes: [
        'White grabs the centre with a pawn and opens lines for the queen and the light-squared bishop.',
        'Black answers in kind: one pawn each in the middle.',
        'A knight comes out and immediately attacks e5. Develop with a threat when you can.',
        'Black defends e5 by developing too. Two principles in one move.',
        'The bishop eyes f7, the weakest square in Black’s camp, guarded only by the king.',
        'Black mirrors, aiming at f2. The “Giuoco Piano”, the quiet game, is one of the oldest openings recorded.',
        'A modest pawn prepares d4 one day, building a broad centre.',
        'Black develops the last minor piece on the kingside and attacks e4.',
        'White defends e4 calmly. The modern “Giuoco Pianissimo”, very quiet, is played by world champions.',
        'Black frees the light-squared bishop and supports e5.',
        'White castles: king tucked away, rook heading to the centre.',
        'Black castles too. Both sides have followed every opening principle. Now the real game begins.'
      ]
    },
    {
      id: 'ruy', name: 'Ruy Lopez', eco: 'C84', side: 'White', style: 'Rich, strategic, the “Spanish torture”',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O'],
      notes: [
        'King’s pawn: the most popular first move in history.',
        'Black stakes an equal claim.',
        'Attack e5 while developing.',
        'Defend e5 while developing.',
        'Named after the 16th-century Spanish priest Ruy López de Segura. The bishop pressures the knight that guards e5.',
        'The Morphy Defence: “Well, bishop, what are you going to do?”',
        'Keep the pin-like pressure without trading.',
        'Black counterattacks e4 instead of worrying.',
        'White castles and offers the e4 pawn indirectly. Taking it leads to sharp lines.',
        'A solid, flexible setup: bishop to e7, castle next.',
        'The rook defends e4 and quietly claims the e-file.',
        'Black finally chases the bishop away.',
        'The bishop retreats to its best diagonal, still eyeing f7.',
        'Black bolsters e5 and opens the c8 bishop.',
        'White prepares d4 and gives the bishop a retreat square on c2. Long-term thinking.',
        'Both kings are safe. This is the main line of the Closed Ruy Lopez, played thousands of times at the top level.'
      ]
    },
    {
      id: 'qgd', name: 'Queen’s Gambit Declined', eco: 'D53', side: 'Both', style: 'Solid, positional, timeless',
      moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3'],
      notes: [
        'Queen’s pawn. The d-pawn is already protected by the queen, so it is a sturdy start.',
        'Black matches it.',
        'The Queen’s Gambit: White offers a wing pawn to lure Black’s centre pawn away. It is not a true sacrifice; White can usually win it back.',
        'Declined. Black keeps a strong point on d5 and opens a path for the dark-squared bishop.',
        'More pressure on d5.',
        'Black defends d5 with a piece and prepares to castle.',
        'The bishop pins the knight to the queen. The pin is annoying, not deadly.',
        'Black breaks the pin calmly.',
        'White opens the f1 bishop’s diagonal.',
        'Black castles. Safe, sound and still played in world championship matches.',
        'All of White’s minor pieces bar one bishop are out. A classic tabiya: a well-known starting point for the middlegame.'
      ]
    },
    {
      id: 'sicilian', name: 'Sicilian Defence', eco: 'B90', side: 'Black', style: 'Sharp, ambitious, fighting',
      moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
      notes: [
        'King’s pawn.',
        'Black fights for d4 from the side and creates an unbalanced game. The most popular reply to 1.e4 at master level.',
        'White develops and prepares d4.',
        'Black controls e5 and prepares Nf6.',
        'White opens the centre.',
        'Black trades a wing pawn for a centre pawn. A good deal in the long run: two centre pawns against one.',
        'White recaptures and has an active, centralised knight.',
        'Black attacks e4 with gain of time.',
        'White defends e4 and develops.',
        'The Najdorf, Bobby Fischer’s and Garry Kasparov’s weapon. A tiny pawn move that controls b5 and keeps every option open.'
      ]
    },
    {
      id: 'caro', name: 'Caro-Kann Defence', eco: 'B18', side: 'Black', style: 'Rock-solid, sensible, low-risk',
      moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
      notes: [
        'King’s pawn.',
        'A quiet move that prepares d5, supported by a pawn.',
        'White takes the whole centre while Black allows it.',
        'Black challenges e4 at once.',
        'White defends e4 with a piece.',
        'Black trades in the centre.',
        'White recaptures with a well-placed knight.',
        'The point of the Caro-Kann: the light-squared bishop gets out before e6 locks it in.',
        'White gains time by chasing the bishop.',
        'The bishop steps back to safety. Black has an extremely solid position, beloved of careful players everywhere.'
      ]
    },
    {
      id: 'london', name: 'London System', eco: 'D02', side: 'White', style: 'A system you can play on autopilot',
      moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3', 'Nc6', 'Nbd2', 'Bd6', 'Bg3'],
      notes: [
        'Queen’s pawn.',
        'Black responds symmetrically.',
        'The London: the bishop comes out before e3 can lock it in.',
        'Black develops.',
        'The pyramid begins: pawns on d4 and e3, soon c3.',
        'Black opens the f8 bishop.',
        'Knight out, kingside ready.',
        'Black strikes at d4 from the side, the most testing plan.',
        'White props up d4 with another pawn.',
        'More pressure on d4.',
        'A knight heads for f3 or e5 later, never blocking the c-pawn.',
        'Black offers a trade of bishops.',
        'White keeps its good bishop. The same setup works against almost anything, which is why busy adults love it.'
      ]
    },
    {
      id: 'scholar', name: 'Trap: Scholar’s Mate', eco: '—', side: 'Know it', style: 'Every beginner meets it in week one',
      moves: ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#'],
      notes: [
        'King’s pawn.',
        'Black matches.',
        'The queen comes out very early, attacking e5 and staring at f7.',
        'Black defends e5. So far so good.',
        'Now two pieces aim at f7, which only the king defends.',
        'The blunder. Black attacks the queen but ignores the threat. The right defence was 3…g6 or 3…Qe7.',
        'Checkmate in four moves. The cure is simple: whenever a queen and bishop line up on f7 (or f2), stop the threat first.'
      ]
    },
    {
      id: 'fool', name: 'Trap: Fool’s Mate', eco: '—', side: 'Know it', style: 'The fastest checkmate possible',
      moves: ['f3', 'e5', 'g4', 'Qh4#'],
      notes: [
        'A weakening pawn move that opens the e1–h4 diagonal.',
        'Black develops normally.',
        'Another kingside pawn move. The king is now naked.',
        'Checkmate in two moves. Moral: in the opening, move centre pawns, not the pawns in front of your king.'
      ]
    }
  ];

  /* ── tactics gym ── */
  /* type 'mate': any move that forces mate in n is accepted.
     type 'line': user moves at even indexes (alternatives with '|'), replies at odd. */
  D.puzzles = [
    { name: 'Back rank', theme: 'The king is trapped behind its own pawns.', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', type: 'mate', n: 1, hint: 'The eighth rank has no defenders.', why: 'Rd8 is mate because the black king is boxed in by its own pawns. Give your king “luft”, an escape square like h3 or g3, before this happens to you.' },
    { name: 'Smothered', theme: 'A knight mates a king surrounded by friends.', fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', type: 'mate', n: 1, hint: 'Which piece can jump in?', why: 'Nf7 is mate. The king’s own rook and pawns block every escape. Only a knight can do this.' },
    { name: 'Fork', theme: 'One piece attacks two at once.', fen: '4k3/pp3ppp/8/1N1q4/8/8/PPP2PPP/4K3 w - - 0 1', type: 'line', moves: ['Nc7+', 'Kd7', 'Nxd5'], hint: 'Find a check that also hits the queen.', why: 'Nc7+ attacks the king and the queen at the same time. The king must move, and the queen falls. The “royal fork”.' },
    { name: 'Pin', theme: 'A piece can’t move without exposing the king.', fen: '4k3/ppp2ppp/3p4/4n3/8/8/PPPP1PPP/4R1K1 w - - 0 1', type: 'line', moves: ['f4|d4', 'Kf8', 'fxe5|dxe5'], hint: 'The knight on e5 is stuck. Attack it.', why: 'The knight is pinned to the king by your rook, so it cannot run. Attack a pinned piece with a pawn and it simply dies.' },
    { name: 'Double attack', theme: 'Check plus a threat.', fen: '4k3/ppp2ppp/8/8/1b6/8/PP3PPP/3Q2K1 w - - 0 1', type: 'line', moves: ['Qa4+', 'c6', 'Qxb4'], hint: 'The bishop on b4 is unprotected.', why: 'Qa4+ checks the king and attacks the loose bishop. Unprotected pieces are tactics waiting to happen.' },
    { name: 'Skewer', theme: 'Attack the king; take what’s behind it.', fen: '8/1q4pp/8/3k4/8/8/PP2BPPP/6K1 w - - 0 1', type: 'line', moves: ['Bf3+', 'Kc5', 'Bxb7'], hint: 'King and queen sit on the same diagonal.', why: 'A skewer is a reverse pin: the more valuable piece is in front and must move, exposing what stands behind it.' },
    { name: 'Discovered check', theme: 'Move one piece; another gives check.', fen: '1q5k/7p/6p1/4N3/8/1P6/PB3PPP/6K1 w - - 0 1', type: 'line', moves: ['Nc6+|Nd7+', 'Kg8', 'Nxb8'], hint: 'Your bishop is aiming at h8. Get the knight out of the way, with a threat.', why: 'The knight moves and unmasks the bishop’s check. Black must deal with the check, so the knight’s threat on the queen comes for free.' },
    { name: 'Remove the guard', theme: 'Capture the defender, then the defended.', fen: '6k1/pp1p1ppp/2n5/1B2b3/8/8/PPP2PPP/4R1K1 w - - 0 1', type: 'line', moves: ['Bxc6', 'dxc6', 'Rxe5'], hint: 'What is protecting the bishop on e5?', why: 'Only the knight guarded e5. Trade it off, and the bishop is left hanging to your rook.' },
    { name: 'Ladder mate', theme: 'Two rooks walk the king to the edge.', fen: '4k3/8/8/8/8/8/8/RR4K1 w - - 0 1', type: 'mate', n: 2, hint: 'One rook takes away a whole rank, the other gives check.', why: 'One rook cuts off the seventh rank, the other delivers mate on the eighth. The rooks “climb the ladder” together.' },
    { name: 'Underpromotion', theme: 'Sometimes a knight beats a queen.', fen: '8/2q1P1k1/8/8/8/8/8/K7 w - - 0 1', type: 'line', moves: ['e8=N+', 'Kf7', 'Nxc7'], hint: 'Promoting to a queen only gets you a queen trade. Count the forks.', why: 'e8=N+ forks king and queen. A new queen would just be traded off; the knight wins outright. About one promotion in a hundred is an underpromotion, and this is why.' }
  ];

  /* ── mating patterns ── */
  D.mates = [
    { name: 'Back-rank mate', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', move: 'Rd8#', note: 'The most common checkmate in amateur chess. The king’s own pawns are its prison bars.' },
    { name: 'Smothered mate', fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', move: 'Nf7#', note: 'A lone knight mates a king buried under its own pieces. Described by Lucena in 1497.' },
    { name: 'Scholar’s mate', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', move: 'Qxf7#', note: 'Queen and bishop meet on f7, a square only the king defends at the start.' },
    { name: 'Ladder mate', fen: '4k3/R7/8/8/8/8/8/1R4K1 w - - 0 1', move: 'Rb8#', note: 'Two rooks (or queen and rook) take turns cutting off ranks until the king hits the edge.' },
    { name: 'Arabian mate', fen: '7k/8/5N2/8/8/8/8/6KR w - - 0 1', move: 'Rh7#', note: 'Rook and knight in the corner, one of the oldest patterns known, from Arabic manuscripts over a thousand years old.' },
    { name: 'Anastasia’s mate', fen: '8/4N1pk/8/8/8/3R4/8/6K1 w - - 0 1', move: 'Rh3#', note: 'A knight seals the escape squares and a rook mates along the edge file. Named after an 1803 novel, “Anastasia und das Schachspiel”.' },
    { name: 'Boden’s mate', fen: '2kr4/p2p4/8/8/5B2/8/4B3/6K1 w - - 0 1', move: 'Ba6#', note: 'Two bishops on criss-crossing diagonals mate a castled king. Samuel Boden showed it in 1853.' }
  ];

  /* ── loose pieces: “tap every black piece you can win” ── */
  D.loose = [
    '4rrk1/ppp2ppp/2n5/3q2b1/8/2N2N2/PPP1QPPP/R4RK1 w - - 0 1',
    'r3k2r/ppp1qppp/2n5/3Np1B1/2B1n3/5N2/PPP2PPP/R2QK2R w KQkq - 0 1',
    'r4rk1/pp3ppp/2p5/4b3/2B1n3/1Q3N2/PP3PPP/R4RK1 w - - 0 1',
    '2r3k1/pp3ppp/3b4/2n5/8/2N2B2/PP3PPP/3R2K1 w - - 0 1'
  ];

  /* ── memory test (Chase & Simon) ── */
  D.memoryReal = [
    'r1bq1rk1/pp2bppp/2n1pn2/3p4/2PP4/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8',
    'r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N2/PP1P1PPP/RNBQR1K1 w - - 0 9',
    'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6',
    'r2qkbnr/pp1nppp1/2p3bp/8/3P4/5NN1/PPP2PPP/R1BQKB1R w KQkq - 0 8',
    'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 0 7'
  ];

  /* ── myths ── */
  D.myths = [
    { q: 'You have to start as a child to get good.', a: 'Sort of', r: 'Reaching grandmaster almost always starts young: Gobet and Campitelli found that players who started serious play before 13 were far likelier to reach international level. But becoming a strong club player, 1600 to 2000, is open to anyone who studies well. Adults bring patience and better study habits.' },
    { q: 'Grandmasters calculate 20 moves ahead.', a: 'Myth', r: 'Adriaan de Groot’s classic study found masters did not search much deeper or wider than club players. They looked at better moves first, because they recognised the patterns.' },
    { q: 'Chess makes you smarter.', a: 'Sort of', r: 'Meta-analyses by Sala and Gobet found modest benefits for schoolchildren, but the effect shrinks to nearly zero against active control groups. Chess makes you better at chess. That is plenty.' },
    { q: 'You need to be good at maths.', a: 'Myth', r: 'Chess skill correlates only modestly with general intelligence, and the link weakens among experienced players. Practice and pattern knowledge matter much more.' },
    { q: 'Memorising openings is the fastest way to improve.', a: 'Myth', r: 'Below about 1800, games are decided by tactics and blunders, not opening theory. Learn principles and one or two simple systems, then spend the time on tactics.' },
    { q: 'Computers have solved chess.', a: 'Myth', r: 'Engines play far better than humans, but chess is not solved. There are about 4.8 × 10⁴⁴ legal positions. Only endgames with seven pieces or fewer are fully solved, in tablebases.' },
    { q: 'Playing chess protects against dementia.', a: 'Sort of', r: 'A 2003 study in the New England Journal of Medicine linked board games and other mentally active leisure with lower dementia risk. It was observational, so it cannot prove cause. Still, a lifelong hobby that keeps you thinking and social is a good bet.' },
    { q: 'Blitz is a waste of time for improvers.', a: 'Sort of', r: 'Fast games are fun and good for pattern recognition, but you learn most from slower games you review afterwards. A 15+10 game you analyse beats ten one-minute games you forget.' }
  ];

  /* ── 12-week plan ── */
  D.plan = [
    ['Learn the moves cold, incl. castling, en passant and promotion', 'Coordinates drill: 5 minutes a day', 'Play 3 games against a bot'],
    ['Play 3 rapid games (15+10) online', 'Solve 10 easy puzzles a day', 'Learn back-rank and Scholar’s mate defences'],
    ['Choose one White opening (Italian or London)', 'Choose one reply to 1.e4 and one to 1.d4', 'Review every loss for the first mistake'],
    ['Learn forks, pins and skewers properly', '20 puzzles a day, slow and accurate', 'Mate with king and queen against king, five times'],
    ['Mate with king and rook against king', 'Play 4 rapid games, blunder-check every move', 'Read one chapter of a classic book'],
    ['Learn discovered attacks and removing the guard', 'Play over one master game, guessing each move', 'Join a club or an online team'],
    ['King and pawn endings: opposition and the square', 'Replay one of your losses without an engine first', 'Puzzle streak: 30 minutes, no hints'],
    ['Play your first over-the-board game, with a clock', 'Learn the Lucena and Philidor rook endings', 'Note your three most common mistakes'],
    ['Pawn structures: isolated, doubled and passed pawns', 'Good versus bad bishops', 'Play 4 rapid games and review them'],
    ['Make a plan in five positions: find the weakness, improve the worst piece', 'Woodpecker-style: re-solve last month’s puzzles', 'Play a long game (30+ minutes each)'],
    ['Enter a weekend tournament, online or over the board', 'Prepare by revising your openings once', 'Sleep well the night before'],
    ['Review the tournament honestly', 'Pick next quarter’s focus', 'Teach a friend the rules. Teaching locks it in.']
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.CHESS_DATA = D;
})(typeof window !== 'undefined' ? window : globalThis);
