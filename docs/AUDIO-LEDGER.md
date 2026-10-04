# Audio ledger

Generated 2026-10-04 by tools/audio-ledger.mjs. Every clip the app can play in a recorded voice is a row of docs/AUDIO-LEDGER.csv: its key (the file name, audio/<key>.mp3, that the app already looks for), its group (the story or lesson it belongs to) and the words with their Eleven v4 audio tags. 6788 clips, 1,256,038 characters in all; the longest clip is 508 characters and the longest whole story 2,751, far under Eleven v4's 10,000 a request. 144 stories carry hand-written tags so far (the writing review adds them course by course); the rest open with their age band's voice direction only.

## How to make the audio

The quickest way is one command. tools/audio-generate.mjs reads the CSV and, for each clip not yet in audio/, asks Eleven v4 (model eleven_v4) to speak the tagged words, passing the words before and after (previous_text and next_text) so a story sounds like one steady telling, and saves audio/<key>.mp3. It skips clips that already exist, so it can be stopped and started again. The app plays recorded clips in place of the device voice as soon as every clip of a story or lesson line is present; until then it keeps the device voice.

    ELEVENLABS_API_KEY=your-key node tools/audio-generate.mjs --voice <voice id> --voice-young <voice id for pre-K to grade 2>
    (add --only S95 for one story, --limit 50 to try a few, --dry-run to see what would be sent)

Pasting into the ElevenLabs app works too, clip by clip, with the text column as written and each file saved as <key>.mp3.

## Characters by age band

ElevenLabs counts characters, tags included, so this is the size of each part of the job.

| Band | Clips | Characters |
|---|---|---|
| Pre-K to grade 2 | 2732 | 304,378 |
| Grades 3 to 5 | 1263 | 278,553 |
| Grades 6 to 8 | 1138 | 272,072 |
| Grades 9 to college | 1655 | 401,035 |

## Voices

| Who | Direction at the start of each clip |
|---|---|
| Pre-K to grade 2, and every pre-reader lesson line | [warm and gentle, drawing out key words] |
| Grades 3 to 5 | [warm and friendly] |
| Grades 6 to 8 | [warm and natural] |
| Grades 9 to college | [warm, conversational] |
| Story titles | [warm] |
| Questions (when the app plays them; next in the audio work) | [warm, pleasant, mildly upbeat] |

Questions stay warm, pleasant and mildly upbeat, never over-excited. Young learners hear words drawn out and stressed the way a favorite preschool teacher says them; older learners hear a warm, engaging voice that never talks down to them (Mikey, pass JH).

## Clips by kind

| Kind | Clips |
|---|---|
| story title | 615 |
| story | 3887 |
| lesson line | 1368 |
| long story title | 102 |
| long story | 816 |

## Stories with hand-written tags

### Three stones (S1, count-to-3)

- S1-1: [warm, playful] Mike had one job, to bring back three stones from the creek, not a pile, just three. He nodded. Easy.
- S1-2: The creek was full of stones, big ones, wet ones, ones that sparkled. [splashing in a creek] Mike scooped a handful and ran back.
- S1-3: [laughing gently] That is a lot of stones, said his teacher with a laugh. I asked for three.
- S1-4: So Mike put one stone on the flat rock, one, and another next to it, two. [slowly, counting] One more made three, and then he stopped.
- S1-5: Three stones, not a pile. He held up three fingers. [proud] Three!
- S1-6: Mike skipped all three across the water, and each one bounced. [stones skipping across water] Plip, plip, plip.
- S1-7: [slowly, warmly] Touch and count. One, two, three. The last number you say tells how many.

### Five ducklings (S2, count-to-5)

- S2-1: [gentle pond sounds] Every morning a mother duck swam across the pond. [ducklings peeping] Behind her came her ducklings, in a wobbly yellow line.
- S2-2: One morning the line felt short, but she could not tell why. [worried] Something was wrong.
- S2-3: She looked back, but looking was no help. [playful] Ducklings wiggle, and swap places, and splash.
- S2-4: So she counted the way ducks count, one bump of the beak for each. [slowly, counting] One bump, two bumps, three bumps, four.
- S2-5: The last number was four, but there should have been five. Four is not five. [alarmed] One duckling was missing!
- S2-6: She turned back, and there in the reeds was the fifth, chasing a bug. [a duckling peeping] Peep! She bumped that one too, [relieved] and that made five.
- S2-7: [slowly, warmly] Count one at a time. The last number you say is how many.

### The rooster and the sun (S23, day-and-night)

- S23-1: [a rooster crowing at dawn] Every morning the rooster crowed, and every morning the sun came up. [proud, a little pompous] The rooster was sure he was the one doing it. One crow from him, and up came the sun.
- S23-2: [softly] Then one morning he slept in. He was so tired from a long day. [sleepy] He tucked his beak under his wing and did not wake up.
- S23-3: When he finally opened his eyes, the sun was already high in the sky. [surprised] It had come up without him! The rooster could hardly believe it.
- S23-4: The sun did not need the rooster at all. [calm, explaining] Our Earth turns slowly, like a big ball spinning on a finger. That slow turning is what makes day and night.
- S23-5: [slowly] When your side of the Earth turns to face the sun, it is day. When it turns away, it is night, [softly, in wonder] and that is when you can see the stars.
- S23-6: [a rooster crowing] The rooster crowed anyway the next morning, [amused] just in case. But now he knew the truth. Day and night come from the Earth turning, not from a rooster.
- S23-7: [slowly, warmly] The sun lights the day. At night the sky is dark. Day and night are the Earth turning.

### The puddle by the gate (S83, kinds-of-weather)

- S83-1: [rain pattering on a roof] Rain came in the night, pit, pat, pit, pat on the roof. In the morning there was a puddle by the gate. [a splash] Rosa splashed right in it.
- S83-2: [warm, birds singing] Then the sun came out, warm and bright. By lunch the puddle was small, and by dinner it was gone. Only a dark spot was left behind.
- S83-3: [wind gusting] The next day the wind blew so hard that leaves ran across the yard. [surprised] Rosa's hat blew off. There was still no puddle.
- S83-4: [hushed] Then one cold morning, white flakes came drifting down. [a delighted whisper] Snow! It landed on the gate, and it did not splash the way rain does. It just sat there.
- S83-5: [slowly, listing] Rain, sun, wind, snow. Every day the sky did something different. Rosa looked out each morning to see what it had chosen.
- S83-6: [thoughtful] The rain made the puddle and the sun took it away. Then the snow laid a white patch there instead. The sky was never the same two days in a row.
- S83-7: [slowly, warmly] Weather is what the sky is doing today. Look out the window and see.

### The rock and the snail (S86, living-or-not)

- S86-1: [curious] On the path there was a rock, and right next to it was a snail. They were the same size and the same gray. Leo looked hard at both of them.
- S86-2: The rock did nothing at all. It just sat. [slowly, fascinated] The snail poked out two eyes, stretched, and slowly began to eat a leaf.
- S86-3: Leo put a leaf on the rock to see what would happen. [amused] The rock did not eat it. The leaf just sat there on top.
- S86-4: When he came back after lunch, the rock was exactly where he had left it. [surprised] But the snail was gone. All that was left was a silver trail.
- S86-5: [thoughtful] The snail grew, and ate, and moved. It needed water and food to do all of that. The rock needed nothing, and it never would.
- S86-6: [warmly] A rock is not alive, but a snail is. They can look alike at first, so watch for a while, and you will know.
- S86-7: [slowly, warmly] Living things grow and need food and water. A rock does not.

### The bean on the windowsill (S89, what-plants-need)

- S89-1: [gentle] A bean seed went into a pot of soil, and Mia pushed it down with her thumb. Every morning after that, it got a drink of water.
- S89-2: [delighted] One day a green sprout came up, and then a leaf, and then two. Mia checked on it every single morning.
- S89-3: [slowly] The little plant began to lean. It leaned toward the window, toward the sun, a bit more every day.
- S89-4: [a cupboard door closing] Mia moved the pot into a dark cupboard, just to see what would happen. [worried] Three days later the plant drooped, and its leaves went pale.
- S89-5: Back it went to the windowsill, with water and sun. [relieved] In a few days it stood up again and turned green.
- S89-6: [thoughtful] The plant drank water and soaked up sunlight. Take one away and it drooped, but give it both and it grew.
- S89-7: [slowly, warmly] A plant needs water, sun and air to grow.

### Two cups (S92, hot-and-cold)

- S92-1: The cocoa was hot, so hot that steam came curling up from the cup. [blowing gently] Sam had to blow on it, and wait, and blow on it again.
- S92-2: [shivering] The snow cone was cold. It made his teeth hurt and his hands wet, so he ate it fast.
- S92-3: He left half the cocoa on the table, with half the snow cone right next to it. [footsteps running off] Then he ran off to play.
- S92-4: [curious] When he came back, the cocoa was not hot anymore. It was only warm, and a little later it was not even that.
- S92-5: The snow cone was not cold anymore either. It had melted into a puddle of juice. [surprised] When Sam touched both cups, they felt the same.
- S92-6: [thoughtful] Hot things cool down and cold things warm up. In the end it all feels as warm as the room.
- S92-7: [slowly, warmly] Hot things warm us and cold things chill us. Then they both end up as warm as the room.

### Two balls (S95, red-and-blue)

- S95-1: [cheerful] Mia had a ball, and it was red, red like a strawberry. [a ball rolling on grass] She rolled it down the yard.
- S95-2: Sam had a ball too, and it was blue, blue like the sky. He rolled his ball after hers.
- S95-3: [soft bump] Bump! The two balls hit and stopped together in the grass. Mia ran over, and so did Sam.
- S95-4: [puzzled] Which one is mine? said Mia. They were the same size and the same shape, and they felt the same.
- S95-5: Mia looked hard, and then she smiled. [happily] Mine is red, she said, and she picked up the red ball.
- S95-6: Sam laughed. [playful] Mine is blue, he said, and he picked up the blue ball and took it home.
- S95-7: [slowly, warmly] Red and blue are colors. Colors help us tell things apart, even when all else is the same.

### One small bed (S98, big-and-small)

- S98-1: [warm, playful] Max was a big dog, long and tall. When he lay down, he filled the rug.
- S98-2: Bean was a small dog, short and light. She could fit in a basket.
- S98-3: There was one bed, and it was a small bed. Both dogs wanted it.
- S98-4: Max tried it first. He squeezed in, but his legs hung off and his tail hung off. [amused] He did not fit.
- S98-5: Bean tried it. She curled up until her nose touched her tail. [softly, pleased] Just right.
- S98-6: [a big dog sighing] Max sighed and lay down on the big rug. [whispers] Both dogs fell asleep.
- S98-7: [slowly, warmly] Big things take up more room, and small things take up less. A small bed fits a small dog.

### Splash (S101, one-and-two)

- S101-1: [softly, gentle water lapping] One duck swam on the pond, all by itself. The water was still.
- S101-2: It quacked. [a single duck quacking] Quack! [quietly] Nobody quacked back, and only the wind moved.
- S101-3: [wings flapping, coming closer] Then a shape came in the sky, wings and feathers, coming closer.
- S101-4: [a big splash] Splash! Another duck landed, and water flew up. The first duck jumped.
- S101-5: [happy] Now there were two ducks, two heads and two tails, and they swam together.
- S101-6: [two ducks quacking] Quack, quack! Two quacks, not one, and the pond was not quiet anymore.
- S101-7: [slowly, counting] One, then two. One more makes two.

### May I, Please? (S104, please-and-thank-you)

- S104-1: [warm] Sam was drawing a big red fire truck. He needed the red crayon, but it was in Ana's hand.
- S104-2: [quick] Sam reached over and grabbed it. [sharply] Mine! he said.
- S104-3: [softly, sad] Ana's face crumpled, and her lip shook. She was not done with it yet.
- S104-4: [slowly, thoughtful] Sam looked at her sad face, and his tummy felt funny. He gave the crayon back.
- S104-5: Then he tried again. [gently, kindly] Ana, may I have the red crayon, please, when you are done?
- S104-6: [warmly] Ana smiled and drew one more line. Here you go, she said. [happily] Thank you! said Sam.
- S104-7: [slowly, warmly] Please is the kind way to ask. Thank you shows we are glad. Kind words make friends glad too.

### One color at a time (S107, colours)

- S107-1: [rain pattering on a window] It rained all morning. Lena watched the drops run down the glass, drip, drip, [wistful] and she wanted to go out.
- S107-2: [brightening] Then the rain stopped, the sun came out, and the whole yard sparkled.
- S107-3: Lena ran outside and looked up. [amazed] A rainbow! It went all the way across the sky.
- S107-4: She wanted to name it, but it had so many colors. [wondering] Where should she start?
- S107-5: Dad said to start at the top. [slowly, naming each color] Red, said Lena. Then orange, then yellow, then green.
- S107-6: Then blue, then purple, every color she could see. She said them one at a time, then again, fast.
- S107-7: [slowly, warmly] Every color has a name, and naming them helps us tell things apart.

### Red, blue, red, blue (S110, patterns)

- S110-1: [warm] Kai was making a necklace. He had a bowl of beads, red ones and blue ones, and a long string.
- S110-2: [beads clicking, steady] Red bead, blue bead, red bead, blue bead, and he threaded them on.
- S110-3: Then he stopped. [puzzled] What comes next? He held a bead in the air, and he did not know.
- S110-4: Grandma said to look back, so Kai looked at the string. [slowly] Red, blue, red, blue.
- S110-5: He said it out loud, red, blue, red, blue, and then he knew. [excited] Red! The next one was red.
- S110-6: Red, blue, red, blue, all the way to the end. The necklace was long, [proud] and Grandma put it on.
- S110-7: [slowly, warmly] A pattern repeats. Say it out loud to find what comes next.

### Count to ten (S113, taking-turns)

- S113-1: One swing, and two children, Sam and Rosa. Both wanted it, [impatient] and both wanted it now.
- S113-2: [tugging and grunting] Pull, pull. Sam pulled one way and Rosa pulled the other, and nobody swung.
- S113-3: [kindly] You go, said Rosa, and then I go. She let go of the swing, and Sam sat down.
- S113-4: [a swing creaking] Rosa counted. [slowly, counting] One, two, three, and Sam swung high. Four, five, six, and higher.
- S113-5: [excited] Seven, eight, nine, ten! Sam jumped off and Rosa sat down, and now Sam counted.
- S113-6: [children laughing] Ten for Sam and ten for Rosa. Both of them swung, and both of them flew.
- S113-7: [slowly, warmly] Wait, and then it is your turn. Count to ten.

### Cat, mat, hat (S116, listen-for-rhymes)

- S116-1: [softly, a bedtime voice] At bedtime, Mom read a rhyme about a cat that sat on a mat. [giggles] Rosa giggled. [playful, rhyming] Cat, mat.
- S116-2: [gently] Hear it? said Mom. Rosa listened. Cat and mat ended the same way, [slowly, stretching the sounds] at and at.
- S116-3: The cat put on a hat. [delighted] Hat! Rosa said it. Cat, mat, hat, all the same at the end.
- S116-4: What else? said Mom, and Rosa thought. [thoughtful] She thought hard.
- S116-5: [excited] Bat! [wings fluttering past a window] A bat flew past the window. Cat, mat, hat, bat, four words with one ending.
- S116-6: They made up more, rat and sat and fat. [whispers] Rosa was still saying them when she fell asleep.
- S116-7: [slowly, warmly] Rhymes end the same way. Listen for the ending.

### The other mitten (S119, find-the-match)

- S119-1: [excited] Snow! Leo wanted to go out, so he needed his mittens. He found one, and it was red.
- S119-2: One mitten, but two hands, so one hand would be cold. [wondering] Where was the other one?
- S119-3: [soft rustling] Leo tipped the basket over, and out came mittens of every kind. Blue ones, black ones and striped ones.
- S119-4: [playful] He held up a blue one. No, not the same. He held up a big black one. No, too big.
- S119-5: Then he saw it, a red one, small and soft, just like the first. He put them side by side. [delighted] A match!
- S119-6: Two red mittens meant two warm hands. [footsteps crunching in snow] Leo ran out into the snow.
- S119-7: [slowly, warmly] Same means just alike. Look for the same color and the same size.

### Like me? (S122, match-the-animals)

- S122-1: [softly] A little duckling woke up alone in the big barn. Where was everyone? [small, hopeful voice] Is there anyone like me?
- S122-2: It saw a hen. The hen had feathers, but they were brown, and it clucked. [hen clucking] No, not like me.
- S122-3: It saw a goat, big, with horns, and it said maa. [goat bleating] No, not like me.
- S122-4: It saw a cat, soft, but with fur and not feathers, and it said meow. [cat meowing] No, not like me.
- S122-5: [quietly, a little sad] The duckling sat down in the straw and peeped one small peep.
- S122-6: [a duckling peeping] Peep! Something peeped back. Another duckling, with the same yellow, the same feathers and the same peep. [overjoyed] Yes, just like me!
- S122-7: [slowly, warmly] The same means just alike. Look closely, and then look again.

### Two bowls (S125, more-or-fewer)

- S125-1: [warm] Two bowls sat on the table, and both had green grapes, cold from the fridge.
- S125-2: This bowl was full, with grapes piled up high. That bowl had three, just three at the bottom.
- S125-3: Ana looked at one, and then the other. [thinking] Which one had more? She wanted more.
- S125-4: She counted the small bowl. [slowly, counting] One, two, three, and that was all.
- S125-5: She did not count the big bowl, because she could see it was full. [excited] More!
- S125-6: Ana picked the full bowl. [happy munching] She ate one grape, and then another, and there were plenty.
- S125-7: [slowly, warmly] More means the bigger group, and fewer means the smaller one. The full bowl had more, and the small bowl had fewer.

### The first line (S128, first-marks)

- S128-1: [warm, playful] Kai had a new crayon, fat and red, and he held it tight.
- S128-2: He pressed it on the paper, and it made a dot. [soft tap] One red dot.
- S128-3: [thoughtful] A dot is nice, but it just sits there. It does not go anywhere.
- S128-4: [crayon scribbling] Kai moved his hand, and the dot grew a tail. The tail got longer, and it was a line! [giggles] A wobbly line.
- S128-5: The line went across, then up, then right off the page. [a child laughing] Kai laughed.
- S128-6: [quick crayon scribbles] He made another, and another, until lines were all over. His page was full.
- S128-7: [slowly, warmly] Start at the dot. Follow the line. A line is a dot that went for a walk.

### One, two, three (S131, three-dots)

- S131-1: [slowly, counting] One, two, three. Three dots on the page, just dots. Rosa looked at them.
- S131-2: [curious] What were they for? Dots do not do anything, and they just sit.
- S131-3: Rosa put her crayon on dot one and drew to dot two. [pleased] A line!
- S131-4: From two, she drew to three, and that was another line. Now there was a corner.
- S131-5: From three, she drew back to one, the last line, and the lines met.
- S131-6: Rosa held up the page. The dots had become a shape with three sides and three corners. [delighted] A triangle!
- S131-7: [slowly, warmly] Start at 1. Draw to each dot in order. The dots know the way.

### Where Is the Frog? (S134, yellow-and-green)

- S134-1: [cheerful] Theo had two bath toys, a yellow duck and a green frog. Today they got to play outside.
- S134-2: [playful whisper] Let's hide them! said Theo. [soft rustling grass] He tucked the duck and the frog into the tall green grass.
- S134-3: Grandma came out to look, and [pleased] she saw the yellow duck right away. Yellow on green is easy to spot.
- S134-4: [puzzled] But where was the frog? Grandma looked and looked. Green on green is hard to see.
- S134-5: [a child giggling] Theo giggled. [delighted] The frog is green like the grass, he said. It looks just like the grass!
- S134-6: At last Grandma found it by a green leaf. [happily] Theo held up both toys, one yellow and one green.
- S134-7: [slowly, warmly] Yellow like a banana, green like the grass. When colors are different, they are easy to tell apart.

### Pizza corners (S137, triangles-too)

- S137-1: [cheerful] Dinner was pizza, a big round pizza cut into slices.
- S137-2: Diego took a slice. It had a pointy end and a wide end, [blowing on hot food] and it was hot.
- S137-3: He counted the corners. [slowly, counting] One corner, at the point.
- S137-4: Two corners and three corners, at the wide end, and then no more. He counted again. [pleased] Three.
- S137-5: Three corners and three sides, and Diego knew that shape. [delighted] A triangle, almost!
- S137-6: [pencil scratching] He drew a triangle on his napkin, with three straight lines and three corners. It looked like his pizza.
- S137-7: [slowly, warmly] A triangle has three corners. Count them. One, two, three.

### Two shoes (S140, big-and-little)

- S140-1: [warm, playful] By the door there were two shoes, one big and one little. Lena looked at both.
- S140-2: She tried the big one. Her foot went in, and in, and in. [giggles] It swam inside.
- S140-3: She tried to walk. [heavy clomping footsteps] Clomp, wobble, and the big shoe fell off.
- S140-4: She tried the little one, and her foot went in and stopped. [pleased] Just right.
- S140-5: The big shoe was Dad's, and the little shoe was hers.
- S140-6: Dad put on the big one and Lena put on the little one, [a door opening] and they went out together.
- S140-7: [slowly, warmly] Big things take up lots of room, and little things take up just a little. That is how Lena knew which shoe was hers.

### Roll or sit (S143, circle-and-square)

- S143-1: [curious] Ana had a ramp, a ball and a block. Which one would roll?
- S143-2: She put the ball at the top. [a ball rolling down a ramp] Whee! It rolled down fast, all the way.
- S143-3: She put the block at the top, and it just sat there. [puzzled] It did not move.
- S143-4: She gave it a push. [a wooden block thunk] It tipped over, and then it stopped. No rolling.
- S143-5: [thoughtful] Ana looked at the ball, round all over. She looked at the block, with corners and flat sides.
- S143-6: Round rolls, and corners sit. Ana rolled the ball again. [a ball rolling, delighted] Whee!
- S143-7: [slowly, warmly] A circle is round. A square has corners.

### A, then B (S146, a-and-b)

- S146-1: [cheerful, party chatter in the background] It was a party, and a banner hung across the room. It had big letters on it.
- S146-2: [wondering] Kai looked up. He knew they were letters, but he did not know their names.
- S146-3: Grandma came over and pointed at the first one. [warm, grandmotherly] That is A, she said.
- S146-4: A was tall, with a bar across the middle. [proudly] Kai said it. A.
- S146-5: Next to it was B, with two round bumps on one side. B, said Grandma. [slowly] A, then B.
- S146-6: Kai said them together, A and B, [clapping] and Grandma clapped. So he said them again.
- S146-7: [slowly, warmly] A and B are letters. A comes first. B comes next.

### The green apple (S149, not-the-same)

- S149-1: [warm, curious] Four apples sat in a row, red, red, red and green. Mia looked at them.
- S149-2: [gently] Which one is different? asked Dad. Mia looked, and looked.
- S149-3: Three apples were red, with the same color and the same shine.
- S149-4: One apple was green, not like the others. [excited] Different!
- S149-5: Mia pointed at that one, the green one, and Dad nodded.
- S149-6: Mia picked it up and took a bite. [an apple crunching] Crunch. It was sour, and good.
- S149-7: [slowly, warmly] Different means not alike. Find the one that does not match.

### Where is the dog? (S152, listen-and-tap-pictures)

- S152-1: [warm] Three cards lay on the table. One had a dog, one had a cup, and one had a hat. Leo looked at them.
- S152-2: [playful] Dog, said his sister. Where is the dog?
- S152-3: Leo looked, and there! He tapped the dog card, [cheering] and his sister cheered.
- S152-4: [playful] Cup, she said, and where is the cup? Leo looked again.
- S152-5: [excited] There! He tapped the cup. Hat, she said, and he tapped the hat.
- S152-6: [proud] Every word had a picture, and Leo found them all. He wanted more cards.
- S152-7: [slowly, warmly] A word names a thing. Hear the word, and you can find its picture.

### Who said that? (S155, animal-sounds)

- S155-1: Rosa stood at the fence and heard a sound. [a cow mooing in the distance] Moo! [curious] Who said that?
- S155-2: She looked, and there was a cow, big and brown. [a cow mooing] Moo, it said again. The cow!
- S155-3: [a duck quacking] Then, quack! Who said that? Rosa looked, and there was a duck by the pond. The duck!
- S155-4: [a cat meowing] Then, meow! Who said that? Rosa looked up, and there was a cat on the post. The cat!
- S155-5: [playful] Rosa played a game with the sounds. Moo! She pointed at the cow. Quack! She pointed at the duck.
- S155-6: Meow! She pointed at the cat. [proud] Every animal had its own sound, and Rosa knew them all.
- S155-7: [slowly, warmly] Many animals have a sound of their own. Listen, and the sound tells you who is there.

### Two socks (S158, same-and-different)

- S158-1: Kai needed socks, [rummaging in a drawer] so he dug in the drawer. He found two with blue and white stripes.
- S158-2: He held them together, stripes and stripes, the same size. [wondering] Were they the same? They looked it.
- S158-3: [gently] Look again, said Mom. Kai looked closer, and closer still, until his nose almost touched them.
- S158-4: One sock had a hole, right at the toe, [surprised] and his finger went through it. The other sock had no hole.
- S158-5: This one has a hole, and that one does not. They were not the same after all. [delighted] Different!
- S158-6: Kai wore the good sock and waved the holey one. [laughs] Mom laughed and got the sewing box.
- S158-7: [slowly, warmly] The same means alike in every way. One small difference, like a hole, makes two things different. Look twice to be sure.

### The other red car (S161, match-the-vehicles)

- S161-1: Sam had a red car, small and shiny. [playful, a toy car revving] Vroom! He wanted to race it, but a race needs two.
- S161-2: [playful] He looked down the line and held up a truck. No, too big, and not the same.
- S161-3: A bus was yellow and long, so no. A tractor was green with big wheels, so no.
- S161-4: Sam looked and looked, and then, at the end of the line, [hopeful] he saw something red.
- S161-5: Another red car, with the same size, the same shine and the same four wheels! He put them side by side. [delighted] Twins!
- S161-6: [toy cars racing across a rug] Two red cars, vroom, vroom, raced across the rug. [laughing] The red one won, and the red one came second.
- S161-7: [slowly, warmly] The same means just alike. Same color, same size, same shape.

### Twins on the table (S164, match-the-things)

- S164-1: [dishes clinking] Ana was helping, and the dishes were on the table in a jumble of cups, spoons and plates.
- S164-2: She found a cup, and then another cup, blue like the first. They went together. [pleased] Twins.
- S164-3: She found a spoon and wondered what went with it. [thinking] A cup? No, because a cup is not a spoon.
- S164-4: She hunted, and there was another spoon, shiny. [pleased] Together. Twins.
- S164-5: A plate, and another plate, together. Every thing on the table had a twin.
- S164-6: Ana set them out in pairs, cup with cup, spoon with spoon and plate with plate. [proud] The table looked neat.
- S164-7: [slowly, warmly] The same means just alike. Find the twin.

### Two of each (S167, match-the-water-animals)

- S167-1: [gentle pond sounds] Leo lay on his tummy by the pond and looked in. The water was full of animals.
- S167-2: [a soft splash] A fish, orange, and then another fish, just the same. Two fish, and they swam together.
- S167-3: [a frog croaking] A frog sat on a rock, green with a white belly. [wondering] Where was its twin?
- S167-4: [searching, slowly] Leo looked in the reeds, under the leaves, and on the log.
- S167-5: [excited] There, on the lily pad! Another frog, just the same, green with a white belly. Two frogs.
- S167-6: [ducks quacking softly] Then two ducks floated by. Two of each. In the pond, everyone had a match.
- S167-7: [slowly, warmly] The same means just alike. Every animal had a twin.

### Two by two (S170, match-the-land-animals)

- S170-1: [playful] Two rabbits hopped by, with the same ears, the same hop and the same white tails.
- S170-2: Two cows stood in the field, with the same spots and the same slow chew. [cows mooing] Moo, moo.
- S170-3: [a pig oinking] One pig rolled in the mud, pink and round, just one. Rosa frowned. [puzzled] Where was its twin?
- S170-4: [searching] She looked in the barn, she looked by the trough, and she looked behind the hay.
- S170-5: [a big muddy splat] Then, splat! Another pig flopped into the mud, pink and round and just the same. Two pigs.
- S170-6: [happy] Two by two, the rabbits, the cows and the pigs. Every animal on the farm had a match.
- S170-7: [slowly, warmly] The same means just alike. Two by two.

### The right hole (S173, match-the-shapes)

- S173-1: [curious] Diego had a box with three holes, a round one, a square one and a triangle one. And he had a block.
- S173-2: The block had three corners. He tried the round hole and pushed, but it did not fit. [straining] It stuck.
- S173-3: He tried the square hole and pushed harder, but it did not fit either. [frustrated] He was getting cross.
- S173-4: Mom said to look at the block and look at the hole. [gently] Are they the same shape?
- S173-5: Three corners on the block, and three corners on the triangle hole. [delighted] Yes, the same! In it went. [a soft plop] Plop.
- S173-6: Diego picked up the round block and knew which hole it wanted, the round one, of course. [a soft plop] Plop.
- S173-7: [slowly, warmly] The same means just alike. Same shape, same hole.

### Stack or roll (S176, match-the-solids)

- S176-1: [warm, playful] Mia had a pile of shapes, some cubes and some balls, and she wanted to build.
- S176-2: She took a cube and another cube, just the same, and put one on top. It stayed. [pleased] A tower!
- S176-3: Then a ball and another ball. She put one on top of the cube, [a ball wobbling and rolling away] and it wobbled and rolled off.
- S176-4: She tried again, and the ball rolled off again. [amused] Balls do not stack. Balls roll.
- S176-5: So Mia matched them up, cubes with cubes and balls with balls. The ones alike went together.
- S176-6: The cubes made a tall tower, and the balls went in a basket. [satisfied] Each thing was in its place.
- S176-7: [slowly, warmly] The same means just alike. Cubes stack. Balls roll.

### Five, then two (S179, more-and-fewer-5)

- S179-1: Theo sat on the dock, and five ducks floated by. He counted them. [slowly, counting] One, two, three, four, five.
- S179-2: Five ducks, and five fingers. He held up his whole hand. [proud] Five!
- S179-3: [wings flapping] Then, flap, flap, flap! Three ducks flew away, up over the trees, and were gone.
- S179-4: Theo looked at the water and counted again. [slowly] One, two. Only two ducks were left.
- S179-5: [thoughtful] Now there were fewer ducks, two instead of five. He held up two fingers, then five, then two.
- S179-6: [two ducks quacking] The two ducks quacked at him. The pond seemed much quieter now, since more ducks had made more noise.
- S179-7: [slowly, warmly] More is the bigger group. Fewer is the smaller group.

### The pumpkin wagon (S182, bigger-and-smaller)

- S182-1: [cheerful] It was pumpkin day, and Rosa had a red wagon. She wanted one pumpkin to take home.
- S182-2: She saw a huge one, bigger than the wagon! [straining] She pushed, but it did not move. [laughing] Too big.
- S182-3: She saw a tiny one, small as her fist. She put it in, [something small rolling in a wagon] and it rolled around. Too small.
- S182-4: [footsteps in dry leaves] Rosa walked the whole patch, past big ones and little ones. She wanted just right.
- S182-5: [delighted] There! A middle one, not huge and not tiny. She lifted it, and it fit the wagon, snug.
- S182-6: [a wagon rolling] Rosa set it in the wagon and pulled her pumpkin home, slow and steady.
- S182-7: [slowly, warmly] Bigger things take up more room. Smaller things take up less.

### Lines on the window (S185, first-strokes)

- S185-1: [rain on a window] It was raining, and the window was fogged up. Ana pressed her finger on it, [a finger squeaking on glass] and it squeaked.
- S185-2: [softly] Her finger went down and left a line, a clear line in the fog, straight down.
- S185-3: Then she drew across, and another line crossed the first one. [pleased] A plus sign.
- S185-4: [playful] Then a wavy one, up and down, up and down, like a wave and like a snake.
- S185-5: Down, across, wavy. Lines can go any way you like, [happily] so Ana drew and drew.
- S185-6: [gentle wonder] Soon the whole window was lines, and she could see the yard through them.
- S185-7: [slowly, warmly] Start at the dot. Follow the line. A line goes where your finger goes.

### What is it? (S188, connect-the-dots)

- S188-1: Leo had a page of dots, and each dot had a tiny number. [curious] What was hiding in there?
- S188-2: [slowly, counting] One to two, and he drew a line. Two to three, and another line. What is it?
- S188-3: Three to four, then four to five. That made a corner, and then another corner. [puzzled] Leo could not tell yet.
- S188-4: [wondering] Is it a house, he guessed, or is it a boat? He kept going, six, and then seven.
- S188-5: Eight, and the last line! Leo sat back and saw points all around. [amazed] A star!
- S188-6: [warmly] The dots had known all along. They just needed to be joined in order.
- S188-7: [slowly, warmly] Start at 1. Draw to each dot in order. The picture comes out.

### Back to the dot (S191, draw-the-shapes)

- S191-1: [warm] Mia put her crayon on the dot. Start here, go round. She started.
- S191-2: [a crayon gliding on paper] Round and round, the curve grew. It was like a moon, and then like a bowl.
- S191-3: She stopped and looked. Her circle had a gap, like a door in it. [thoughtful] It was not a circle yet.
- S191-4: [encouraging] Almost there, said her teacher. Keep going, and do not stop early.
- S191-5: Mia kept going, round and round, back to the dot. The gap closed. [delighted] A circle!
- S191-6: [happy] She drew another one, all the way round with no stopping. Two circles, and then three.
- S191-7: [slowly, warmly] Start at the dot. Go all the way around. Back to the dot.

### Three bowls (S194, big-bigger-biggest)

- S194-1: [like a storyteller] Three bears had three bowls, a little bowl, a middle bowl and a big bowl.
- S194-2: Little bear grabbed the big bowl, and it was too heavy! [a bowl wobbling, porridge splashing] It wobbled, and porridge spilled.
- S194-3: Big bear took the little bowl, and it was too small! [a big gulp] One bite, and it was empty.
- S194-4: Middle bear looked at the middle bowl. [slowly, pleased] Not too big, not too small, but just right.
- S194-5: So little bear took the little bowl, and big bear took the big bowl. [happy] Now everyone matched.
- S194-6: [warm] Little, middle, biggest. Three bears, three bowls, three sizes in a row.
- S194-7: [slowly, warmly] Little, middle, biggest. Three sizes in a row.

### Helpers (S197, helpers-all-around)

- S197-1: Kai walked to school, [cars zooming past] and cars zoomed by. [a crossing guard whistle] The crossing guard held up her sign, the cars stopped, and Kai crossed.
- S197-2: [bus doors opening] The bus pulled up and the driver opened the door. [cheerful] Good morning, he said, and Kai climbed in.
- S197-3: At school, Kai fell and hurt his knee. [gently] The nurse cleaned it and put on a bandage, and it was all better.
- S197-4: [a fire truck siren in the distance] A fire truck drove by the window, and the driver waved. Kai waved back.
- S197-5: [warmly] Helpers were all around him. Each one had a job, and each one helped.
- S197-6: At dinner, Kai told everyone about the guard, the bus driver, the nurse and the fire truck. [proud] Four helpers in one day.
- S197-7: [slowly, warmly] Helpers are all around. Every helper has a job.

### Buh and sss (S200, first-sounds)

- S200-1: [warm, classroom chatter in the background] Ben, said the teacher, what does Ben start with? Ben pressed his lips together, [slowly, stressing the first sound] buh, and there it was. Ben starts with buh.
- S200-2: Sam, said the teacher. Sam thought, and then he said his name slowly. [slowly, drawing out the s] Sss-am.
- S200-3: [a playful hiss] Sss! Like a snake. Sam starts with sss, and he hissed, [children laughing] and everyone laughed.
- S200-4: Mia, said the teacher, and Mia closed her lips and hummed. [humming] Mmm. Mia starts with mmm.
- S200-5: [slowly, stressing each first sound] Buh like ball, sss like sun, and mmm like moon. Every name had a first sound.
- S200-6: They pointed at each other. [playful] Buh! Sss! Mmm! They did it all the way to snack time.
- S200-7: [slowly, warmly] Listen to the start of the word. That is the first sound.

### The roar came first (S203, which-came-first)

- S203-1: Leo was at the zoo. [a lion roaring] Roar! [a parrot squawking] Then, squawk! [curious] Two sounds, but which one came first?
- S203-2: [thoughtful] Leo had to think back, so he closed his eyes. What had he heard first?
- S203-3: [slowly] The roar, and that was the lion. It came first. Then the squawk, so the parrot came after.
- S203-4: Dad tried again with two new sounds. [a duck quacking] Quack! [a cow mooing] Then, moo! Which came first?
- S203-5: Leo held the first sound in his head. [slowly] Quack. The duck came first, and the cow came after.
- S203-6: [playful] All day, Leo played the game, first sound and then the next. He never mixed them up.
- S203-7: [slowly, warmly] Hold the first sound in your head while you hear the rest.

### Whistle, tick, woof (S206, which-came-second)

- S206-1: [a kettle whistling, a clock ticking, a dog barking once] In the kitchen there were three sounds, a whistle, a tick and a woof. The kettle, the clock and the dog.
- S206-2: [warm, grandfatherly] Which came second? asked Grandpa. Not the first and not the last, but the middle one.
- S206-3: Ana thought. Whistle was first and woof was last, [excited] so the middle was tick, the clock!
- S206-4: Which came last? Ana knew that one. Woof, the dog, [a dog barking] and it was still barking.
- S206-5: She held up three fingers and said them in a row. [slowly, counting] First whistle, second tick, last woof.
- S206-6: [a clap, a stomp, a snap] Grandpa made new sounds, a clap, a stomp and a snap. [proud] Ana found the second one every time.
- S206-7: [slowly, warmly] Keep the sounds in a row in your head. Then point to the one you want.

### B, U, S (S209, big-letters)

- S209-1: [a school bus pulling up] The bus came, yellow and big, with big letters on its side. Sam looked up.
- S209-2: [curious] He did not know them yet. There were three shapes, one with two bumps, one like a cup and one all curves.
- S209-3: His sister pointed. That one is B, she said, and its name is bee. Sam said bee.
- S209-4: That one is U, and its name sounds like you. And that one, all curves like a snake, is S.
- S209-5: B, U, S. Sam said their names, bee, you, ess. Those letters spell bus, said his sister. Bus!
- S209-6: [proud] Every day after that, Sam named the letters on the bus, B, U, S, for everyone.
- S209-7: [slowly, warmly] Every letter has a name. Say it when you see it.

### A letter in the sand (S212, first-letter-tracing)

- S212-1: [waves rolling in, gulls calling] Diego had a stick, and the sand was wet. Dad made a dot and said to start there.
- S212-2: Diego pushed the stick, and it went wiggly. It went the wrong way. [a little frustrated] That was not a letter.
- S212-3: [sand brushing] He smoothed the sand flat, found the dot again, and tried again.
- S212-4: [gently] Follow the arrow, said Dad. Down, in a straight line. Lift the stick, and now go across the top.
- S212-5: [proud] A letter! A big T stood in the sand, and Diego stood over it. He had made it.
- S212-6: [a wave washing over sand] Then a wave came and washed the T away. [laughs] Diego laughed and made another one.
- S212-7: [slowly, warmly] Start at the dot. Follow the arrow. Lift, then go again.

### Sticks Make Letters (S215, more-big-letters)

- S215-1: [curious] Mia had a pile of sticks, flat ones and colored ones. Could sticks make letters?
- S215-2: One stick stood straight up and down. [delighted] An I! Mia clapped.
- S215-3: [thoughtful] Could she make more? She laid two sticks down, side by side, with a gap between them.
- S215-4: Then one stick went across the middle, like a little bridge. [excited] An H!
- S215-5: One stick down, then three across, at the top, the middle and the bottom. [proudly] An E!
- S215-6: [happily] I, H, E, three letters in a row, all made of straight sticks.
- S215-7: [slowly, warmly] Straight lines make letters. Start at the dot.

### Down, then across (S218, trace-straight-letters)

- S218-1: [slowly, tracing] Down, then across. Kai traced it, down the line and across the bottom. An L.
- S218-2: That was easy. [curious] But his teacher asked what would happen if across went on top.
- S218-3: Kai tried it, down and then across the top. [delighted] A T! [giggles] A hat on a stick.
- S218-4: Now across the top, and across the middle too, two acrosses. [excited] An F!
- S218-5: [amazed] Down, then across, made three letters from one move. Kai traced them all again.
- S218-6: [playful, slowly] L for lamp, T for tree, F for fish. He said them as he went.
- S218-7: [slowly, warmly] Down, then across. Start at the dot.

### One at a time (S221, rules-and-helpers)

- S221-1: [playground noise] At recess, all of the kids wanted the slide at once. [a bump and a cry] Bump, ouch! Diego went down on top of Rosa, and Rosa cried. [sad] Nobody had fun.
- S221-2: [thoughtful] The slide was fine and the kids were fine, so something else was missing.
- S221-3: [calm, clear] The teacher made a rule. Go one at a time, and wait at the top until the bottom is clear.
- S221-4: Now the slide was fun again. [joyful, sliding] Whee! Diego went, then Rosa, then Kai, with no bumps and no tears.
- S221-5: [a fire truck rumbling past] Then a fire truck came by, and the driver waved. A helper, with a job for the whole town.
- S221-6: Rules keep us safe, and helpers do jobs for everyone. [happy] Rosa waved at the truck with both arms.
- S221-7: [slowly, warmly] Rules keep us safe. Helpers do jobs for everyone.

### Bread or the toy (S224, needs-and-wants)

- S224-1: [coins jingling] Ana had money for one thing, and she held the coins tight. Bread, or the toy? [longing] She wanted the toy, and she really, really wanted it.
- S224-2: [a tummy rumbling] But her tummy rumbled, loud. [gently] Her mom asked which one they needed.
- S224-3: [thoughtful] Ana thought about it. We need to eat, but we only want to play, and a need comes first.
- S224-4: [decided] So Ana picked the bread. The toy could wait, but her tummy could not.
- S224-5: [content] At home she ate warm bread with butter, and her tummy stopped rumbling. That felt better than any toy.
- S224-6: The next week, with new coins, she came back, and the toy was still on the shelf. [delighted] This time she could pick it.
- S224-7: [slowly, warmly] Needs come first. Wants can wait.

### Up went the flag (S227, our-flag-and-holidays)

- S227-1: [a flag flapping in the wind] Up went the flag, red, white and blue, waving in the wind. Sam wanted to know what was on it, but it was too far up to see.
- S227-2: [warmly] So the teacher brought a small one down to his desk. It was the same flag, just little.
- S227-3: Sam counted the stripes, [slowly, counting] red, white, red, white, and got thirteen. Then he counted the stars, and that took a while. [proud] Fifty!
- S227-4: [steady] Fifty stars for fifty states, and thirteen stripes for the first thirteen. Red, white and blue.
- S227-5: On holidays, the flag went up early, [festive] and on the Fourth of July everyone waved a little one.
- S227-6: Sam drew the flag at home. [amused] He ran out of room for the stars at thirty, but he did his best.
- S227-7: [slowly, warmly] Fifty stars, thirteen stripes, red, white and blue.

### Off to work (S230, jobs-people-do)

- S230-1: [morning street sounds] In the morning, Lena watched everyone go off to work. The baker went to bake bread, and the nurse went to help sick people. The mail carrier went out with a bag of letters.
- S230-2: [curious] Why did they all go? Lena thought they just liked it. [warmly] Her dad said that was part of it, and that they got paid too.
- S230-3: [explaining] People work to earn money, and money buys the things we need. Food, a home, and new shoes when yours get small.
- S230-4: [slowly, listing] Every job has its tools, too. The baker had a big bowl and the nurse had a stethoscope. The mail carrier had a big bag.
- S230-5: [a spoon stirring in a bowl] Lena played baker with a toy bowl and a wooden spoon, and she baked pretend bread all afternoon.
- S230-6: Then she played mail carrier, with a paper bag and a letter for every room. [warm, laughing] She got paid in hugs.
- S230-7: [slowly, warmly] People work to earn money for needs. Every job has its tools.

### Hands up (S233, voting-in-class)

- S233-1: There were two books for story time, a dragon book and a dog book. Some of the class wanted the dragon and some wanted the dog, [children shouting over each other] so everyone shouted.
- S233-2: [frustrated] Nobody could hear a thing, because shouting did not pick a book. It only made the room loud.
- S233-3: [calm, counting hands] The teacher said to put hands up for the dragon, and she counted nine. Then hands up for the dog, and she counted seven.
- S233-4: One vote each, and nine is more than seven, [cheers] so the dragon won. The dog would get next week.
- S233-5: Nobody shouted, because everyone had counted, and even the dog voters nodded. [warmly] It was fair.
- S233-6: [happy] The dragon book was good, and the next week the dog book was good too. Both of them got their turn.
- S233-7: [slowly, warmly] One vote each. More votes wins.

### Two flags, one pole (S236, our-two-flags)

- S236-1: [flags flapping in the wind] Two flags flew on one pole, and Kai asked why. [puzzled] One flag is enough, he said, so why two?
- S236-2: [curious] His teacher asked him to count the stars on each one, so Kai squinted up at them.
- S236-3: The top one had fifty, one star for every state, too many to count fast. [surprised] The one below had just one big star.
- S236-4: That was the flag for Texas, our state. [proud] One star, the Lone Star.
- S236-5: [warm] Two flags, one for the country and one for home, both on one pole and waving together.
- S236-6: [proud] Kai saluted both of them. Then he drew them, fifty little stars and one big one.
- S236-7: [slowly, warmly] Fifty stars for the country. One star for Texas.

### Ten steps (S239, count-to-10)

- S239-1: [cheerful, playground sounds] Sam wanted to know how many steps went up the big slide. It was tall, and it was the best slide in the park.
- S239-2: He climbed and counted. [slowly, counting] One, two, three, four. [a bird chirping] Then a blue bird flew by, and he stopped to watch it.
- S239-3: When he looked back down, he had lost his place. [puzzled] Was he on five, or six? He did not know.
- S239-4: [frustrated] He tried to start again from the middle, but that did not work. The numbers came out wrong.
- S239-5: So he went back to the bottom and put his finger on the first step. [slowly, counting] One, then two, slowly, one step at a time.
- S239-6: Five, six, seven, higher and higher, then eight, nine, ten. [triumphant] The top! Ten steps, and then, [a whoosh down a slide] whoosh, down the slide.
- S239-7: [slowly, warmly] Count one at a time. The last number is how many.

### Start at the dot (S242, tracing-numbers)

- S242-1: [warm, playful] Lena tried to draw a two, and it came out like a snake. She tried again and got a snake with a hat. [a boy laughing] Her brother laughed.
- S242-2: [puzzled] Where did a two even start? Lena had no idea, so she kept starting in the middle.
- S242-3: Her teacher put a green dot at the top. [gently] Start here, she said, then curve round, and then go down.
- S242-4: Lena put her finger on the dot. Round, down, along the bottom, and stop. [delighted] A two, every time!
- S242-5: [a pencil on paper] Then she did a three, with a dot at the top, round and round. After that came a five. Dot, down and round.
- S242-6: [warmly] Every number had its own dot, and once she knew where to start, the rest followed.
- S242-7: [slowly, warmly] Start at the dot. Follow the arrow. That draws the number.

### One more, one less (S245, one-more-one-less)

- S245-1: [warm, playful] Four chocolate cookies sat on the plate. Mom put one more on, and Diego said that now there were lots.
- S245-2: Mom asked how many, and Diego was not sure. He did not want to count them all again, [laughing] because cookies do not wait.
- S245-3: One more than four is just the next number, said Mom. So Diego counted up, [slowly, counting] four, five, and there were five cookies!
- S245-4: Then his sister came in and ate one. [a cookie crunching] Crunch. One less than five is the number before, so there were four.
- S245-5: [proud] Diego kept track without counting. One more is the next number, and one less is the number before.
- S245-6: [munching] Then he ate one himself, and four became three. Mom put two more on, and three became four, then five. He had it now.
- S245-7: [slowly, warmly] One more is the next number. One less is the number before.

### Cars in the garage (S248, joining-and-taking-away)

- S248-1: Two cars sat in the toy garage, a red one and a green one. Then Ana rolled three more in. [toy cars rolling] Vroom.
- S248-2: [puzzled] Was it more cars now, or fewer? Ana said more, but she could not tell how many, because the cars were all jumbled.
- S248-3: So she counted, with one finger on each car. [slowly, counting] One, two, three, four, five. Joining had made five cars.
- S248-4: [a toy car rolling away] Then one car drove away, out the door and across the rug.
- S248-5: Taking away leaves fewer. Ana counted again, [slowly, counting] one, two, three, four, and there were four cars now.
- S248-6: She rolled two more in, and joining made six. Then she drove three out, and taking away left three. [happy] The garage was busy all morning.
- S248-7: [slowly, warmly] Joining makes more. Taking away leaves fewer. Count to find out how many.

### Which is bigger? (S251, comparing-numbers)

- S251-1: [playful] Leo had six blocks and his friend Max had four. Max said four was bigger, and Leo said six was.
- S251-2: [two children arguing playfully, getting louder] They both said it louder, and then louder still. But being loud did not help, because neither of them could show it.
- S251-3: [blocks clacking] So Leo lined his blocks up in a row, and Max lined his up next to them. One row was longer than the other.
- S251-4: Then Leo counted up, [slowly, counting] one, two, three, four, and there was Max's pile. Five, six, and there was his.
- S251-5: [thoughtful] Six comes later than four when you count, and later means bigger. So six is bigger than four.
- S251-6: Max nodded. [happy] Then they put all the blocks together and counted ten. That was enough for a tower taller than both of them.
- S251-7: [slowly, warmly] The number you say later when counting is the bigger one.

### Counting corners (S254, shapes)

- S254-1: [curious] Rosa knew the clock was a circle and the window was a square. But why? They were both just shapes to her.
- S254-2: Her dad asked her to find the corners. On the clock her finger went round, and round, [puzzled] and never found one.
- S254-3: On the window her finger stopped at a corner, and then at another one. [slowly, counting] It stopped four times, so a square has four corners and four sides.
- S254-4: [thoughtful] A square has four corners, and a circle has none. That is how you tell them apart.
- S254-5: Rosa looked around the room. Her book had four corners, her ball had none, [delighted] and her paper hat had three!
- S254-6: [happy] Three corners and three sides make a triangle. Rosa found shapes all day long.
- S254-7: [slowly, warmly] Count the sides and corners to tell shapes apart.

### All the way around (S257, tracing-shapes)

- S257-1: Kai traced a square. [slowly, tracing] Across, down, back across, and then he stopped. [puzzled] His square had a gap, so it looked like a cup.
- S257-2: [thoughtful] A square with a gap is not a square, but Kai did not know what was missing.
- S257-3: [gently] Start at the dot, said his teacher. Across, down, back across, and up. Go all the way around, back to the dot.
- S257-4: Kai tried it. Across, down, back across, and up! His finger came back to the dot, [delighted] and the gap was gone.
- S257-5: [proud] A square has four sides. He traced it again, and again, with no gaps.
- S257-6: [happy] Then he traced a triangle, three sides all the way around. After that came a circle, round and back to the dot.
- S257-7: [slowly, warmly] Start at the dot and go all the way around.

### Ten fingers each (S260, counting-by-tens)

- S260-1: Mia wanted to count all the fingers in the room, so she started with one. [slowly, counting] One, two, three. [tired] By the third friend she was tired, and lost.
- S260-2: There were too many fingers to count one by one. [warmly] Her teacher smiled and said that every friend has ten.
- S260-3: Ten. Mia looked at one friend and saw ten fingers. She looked at the next friend, and that was ten more. [excited] Twenty!
- S260-4: So she counted by tens, [rhythmic, counting] ten, twenty, thirty, forty, fifty, and every friend was one jump.
- S260-5: [building excitement] Sixty, seventy, eighty, ninety, one hundred! Ten friends made one hundred fingers.
- S260-6: It took a minute instead of the whole morning. [giggles] Then Mia counted the toes, ten each, and got one hundred again.
- S260-7: [slowly, warmly] Count by tens. Ten, twenty, thirty, all the way to one hundred.

### The stick and the rock (S263, longer-and-heavier)

- S263-1: [a creek babbling] Sam found a stick and a rock by the creek. He wanted to know which one was bigger. The stick was longer, but the rock was fatter, so Sam could not decide.
- S263-2: [thoughtful] Bigger, it turned out, was two different things.
- S263-3: The stick was long. When he laid it down, it reached all the way across the creek. [slowly] Longer reaches farther.
- S263-4: The rock was heavy. He tried to lift it, [straining] and he needed both hands and a big grunt. [slowly] Heavier is harder to lift.
- S263-5: [thoughtful] The stick was easy to lift with one hand, but it was long. The rock was short, but it was heavy.
- S263-6: [proud] So Sam sat on the rock and held the stick up like a flag. The longer one and the heavier one, and both of them his.
- S263-7: [slowly, warmly] Longer reaches farther. Heavier is harder to lift.

### The sock pile (S266, sorting)

- S266-1: [playful] Ana had a mountain of clean socks to pair up. She grabbed two, a red one and a blue one, and that was no good. Two more were blue and white, and that was no good either.
- S266-2: Every pair she grabbed was wrong, and the pile did not get any smaller. [a big sigh] Ana flopped back on the bed.
- S266-3: [gently] Her mom said to sort first, putting the ones that are alike together, and to match after that.
- S266-4: [brisk, cheerful] Red socks went here, blue socks went there, and white socks went in the middle. Alike with alike, in three piles.
- S266-5: Then she counted each pile, [slowly, counting] six red, four blue and two white. Now matching was easy, red with red.
- S266-6: Three red pairs, two blue pairs and one white pair made six rolled-up balls in a row. [triumphant] The mountain was gone.
- S266-7: [slowly, warmly] Put things that are alike together. Then count each group.

### Roll, stack, point (S269, solids)

- S269-1: Diego tried to stack a ball on top of a block, [a ball rolling away] and it rolled off. He tried again, and it rolled off again, even farther this time.
- S269-2: [curious] Some shapes stack and some do not, and Diego wanted to know which was which.
- S269-3: [thoughtful] A ball rolls because it is a sphere, round all over. A block stacks because it is a cube, with flat sides all around.
- S269-4: [a can rolling, then set upright] A can rolls when it lies on its side, but stand it up and it stacks. That shape is a cylinder, and it can do both.
- S269-5: A party hat comes to a point at the top. That is a cone, and it sat on top of the tower [pleased] like a little roof.
- S269-6: Cube, cube, cylinder, cone made a tower. [a ball rolling around] The ball rolled around the bottom, because a sphere cannot join a tower.
- S269-7: [slowly, warmly] Solid shapes are things you can hold, like a sphere, a cube, a cylinder and a cone.

### Partners for ten (S272, making-ten)

- S272-1: [warm] Rosa had ten fingers, and her teacher said to fold three down. How many were still up? [impatient] Rosa did not want to count, because counting was slow.
- S272-2: [thoughtful] She looked at her hands. Three fingers were down and the rest were up, but how many was the rest?
- S272-3: She counted them just once. [slowly] Seven. Three and seven together made ten, [delighted] so they were partners!
- S272-4: [gently] Fold two down, said the teacher, and Rosa did. Eight were up, so two and eight were partners too.
- S272-5: [rhythmic, playful] Fold five down and five stay up. Five and five. Fold one down and nine stay up. One and nine.
- S272-6: Every number had a partner, and Rosa went through them all. After that she did not have to count anymore, [proud] because her hands knew.
- S272-7: [slowly, warmly] Every number up to nine has a partner that makes ten.

### Two buckets (S275, more-and-fewer-10)

- S275-1: [waves on a beach] Leo had two buckets of shells and wanted to know which one had more. One bucket was big, so it looked like more. His sister said no.
- S275-2: [thoughtful] A bigger bucket does not mean more shells, so Leo had to check.
- S275-3: [shells clattering] He tipped the big bucket out, lined the shells up and counted them. [slowly] Eight shells.
- S275-4: Then he tipped the small bucket out and made another row. [slowly] He counted six shells. Six was fewer.
- S275-5: Eight is bigger than six, so the big bucket had more after all, [amused] but only by two.
- S275-6: Then his sister found five more shells and put them in the small bucket. Now that one had eleven, [surprised, laughing] and that was more!
- S275-7: [slowly, warmly] Count both. The bigger number has more.

### The song that holds them (S278, letter-names)

- S278-1: Ben knew lots of letters, but he did not know what came next. [slowly] A, B, C, D, and then he stopped. [stuck] His mouth stayed open and nothing came out.
- S278-2: [a bus rumbling] His sister leaned over the bus seat and told him to sing it. Ben said he could not sing letters. [amused] But the bus ride was long, so he tried.
- S278-3: [singing the alphabet song] A, B, C, D, E, F, G. The tune pulled the next letter out, and he did not have to think.
- S278-4: [singing] H, I, J, K, and still going. L, M, N, O, P. The letters lined up like the bus seats.
- S278-5: [singing, building] Q, R, S, then T, U, V, then W, X, Y and Z! He got all the way to the end, [clapping] and his sister clapped.
- S278-6: The next day he sang it for the whole bus. Then he sang it backward, just to see, [laughing] and that was much harder.
- S278-7: [slowly, warmly] Letters have names and an order. The song keeps them in line.

### Big G, small g (S281, big-and-small-letters)

- S281-1: [curious] Mia had two cards. One said G and one said g, and they did not look alike at all. One was tall, [playful] and one had a tail like a monkey.
- S281-2: She was sure they were two different letters, because two cards meant two letters. [gently] Her teacher shook her head.
- S281-3: Her teacher pointed at the big G and asked its name, and Mia said gee. Then her teacher pointed at the small g, and Mia said gee again.
- S281-4: [delighted] Same name, so the same letter, just in different clothes. One was dressed up tall, and one was dressed down small.
- S281-5: Mia tried more cards. Big B and small b were both called bee. Big D and small d were both called dee, and every pair had one name.
- S281-6: She lined them up with the big letters on top and the small ones underneath. [proud] Twenty-six pairs and fifty-two cards made one alphabet.
- S281-7: [slowly, warmly] Big and small are the same letter. One is dressed up. One is not.

### Buh for ball (S284, letter-sounds)

- S284-1: Leo said ball, and his teacher asked what sound it started with. Leo said B. [gently] That is its name, she said, but what is its sound?
- S284-2: [surprised] A letter had a name and a sound? Leo had not known that. So he said ball again, slowly.
- S284-3: He felt his lips pop right at the start. [a soft lip pop] Buh. That was it, and that was the sound.
- S284-4: B was the letter and buh was the sound. [slowly, stressing each first sound] Ball started with buh, and so did bat, and so did bug.
- S284-5: [playground sounds] Leo looked around the playground. Bus was buh, bird was buh, and bench was buh! [delighted] The whole place was full of buh.
- S284-6: He found seven things that started with buh before recess ended. [a ball bouncing] He bounced the ball on every one of them.
- S284-7: [slowly, warmly] Letters make sounds. The first sound of a word usually tells you its first letter.

### What starts with mmm (S287, beginning-sounds)

- S287-1: [curious] Ana had to find something that started with mmm. She held up a cup, but cup had no mmm. She held up a hat, and hat had no mmm either.
- S287-2: [a little discouraged] So she sat down on the floor. Nothing in her room started with mmm, not her bed, not her book and not her ball.
- S287-3: Then she saw her mitten on the dresser and said it slowly. [slowly, humming the m] Mmm-itten. Her lips closed, and they hummed.
- S287-4: [delighted] Mmm! That was it. Mitten started with mmm, so she held it up high.
- S287-5: What else? She looked out the window and saw the moon. [slowly, humming] Mmm-oon. Under the bed she found a toy mouse. [slowly, humming] Mmm-ouse.
- S287-6: Mitten, moon, mouse, three things that started with mmm. [humming] She hummed it all through dinner. Milk! Meat! Mmm.
- S287-7: [slowly, warmly] Say the name. Hear the first sound. Match it to the letter.

### Cat, hat, bat (S290, rhymes)

- S290-1: [softly, a bedtime voice] At bedtime Rosa heard a rhyme about a cat that sat on a hat. [giggles] She giggled, because cat and hat sounded like twins.
- S290-2: [curious] Why did they sound alike? The starts were different, cuh and huh, not the same at all.
- S290-3: The ends were the same, [slowly, stretching the sounds] at and at. Then the bat came in, and there was at again. Three words with one ending.
- S290-4: [thoughtful] That was what made them rhyme, the same ending sound. Rosa listened for it after that.
- S290-5: Mom read on. [playful, rhyming] The dog on a log, og and og! A frog on the log, og! [clapping] Rosa clapped every time.
- S290-6: Then she made up her own: cat, hat, bat, mat, sat, rat. [whispers] She was still going when the light went out.
- S290-7: [slowly, warmly] Rhyming words end with the same sound.

### The T on the window (S293, tracing-letters)

- S293-1: [a finger squeaking on a foggy window] The window was foggy, and Diego pressed a finger on it to make a line. He wanted to make a T, like the one on his cup.
- S293-2: He drew a line across, and then another line across. [puzzled] That looked like an equals sign, not a T.
- S293-3: His mom put a dot at the top of the glass. [gently] Start here, she said. Go down, lift your finger, and then go across the top.
- S293-4: Diego put his finger on the dot. [slowly] Down, lift, across the top. [delighted] A T, dripping a little!
- S293-5: [playful] He made another one next to it. Then he made an L, down and across the bottom, and an I, which was just down.
- S293-6: By the time the fog cleared, the window was full of letters. [softly, a little wistful] Then the sun came out, and they all faded away.
- S293-7: [slowly, warmly] Start at the dot. Follow the arrow. Stay on the line.

### The small a sits low (S296, tracing-small-letters)

- S296-1: Lena traced a big A, and it stood tall. Then came the small a, and she made it tall too. [puzzled] It looked wrong.
- S296-2: [playful] The small a did not want to be tall. It kept falling over, like a bent stick.
- S296-3: [gently] Start at the dot, her teacher said. Go round, then down, and do not go up high. Stay low.
- S296-4: Lena tried it, round and then down. The small a sat low on the line, like a curled-up cat, [pleased] and that was right.
- S296-5: [slowly, tracing] Then she traced the small c, round and stop, low. After that, the small o, round and round, and low.
- S296-6: [proud] Big letters stand tall and small letters sit low. Lena traced a whole line of them, all of them sitting.
- S296-7: [slowly, warmly] Small letters sit low. Start at the dot and follow the arrow.

### The E, one line at a time (S299, tracing-more-letters)

- S299-1: [chalk squeaking] Kai tried to draw an E without lifting his chalk, and he got a wiggly snake with teeth. [giggles] It did not look like an E.
- S299-2: His teacher laughed, kindly. [warmly] An E is not one line, she said. It is four.
- S299-3: [slowly, a steady rhythm] Down and lift, across the top and lift, across the middle and lift, and then across the bottom. That is four lines and three lifts.
- S299-4: Kai tried it. [slowly] Down, lift, across, lift, across, lift, across. [proud] An E, clean and straight!
- S299-5: [playful] Then he made an F, with one line down and two lines across. Three lines and two lifts. Then an H, two downs and a bridge.
- S299-6: Lift, lift, lift, [chalk squeaking] and the chalk squeaked every time. Kai filled the whole board with letters made of lines.
- S299-7: [slowly, warmly] One line at a time. Lift your finger between lines.

### Clap your name (S302, syllables)

- S302-1: [clapping in a circle] Ben clapped his name, Ben, in one clap. Maya clapped hers, Ma, ya, in two. [unsure] Then it was Elijah's turn, and he was not sure.
- S302-2: He said his name fast, and it came out as one blur. [puzzled] How many claps was a blur?
- S302-3: Say it slowly, said the teacher. [slowly, clapping each beat] E. Li. Jah. Clap, clap, clap. Three beats had been hiding in there the whole time.
- S302-4: Elijah clapped it, E, li, jah, [delighted] and that made three! [proud] He grinned, and then he clapped it again, louder.
- S302-5: They went around the circle. Sam was one clap, and Rosa was two, Ro, sa. Then a girl with a long name clapped four, [clapping four beats] Ma, ri, an, na!
- S302-6: [playful, clapping] Then they clapped other words. Apple was ap, ple, and banana was ba, na, na. Every word had beats inside it.
- S302-7: [slowly, warmly] Say the word slowly and clap each beat.

### The word on the door (S305, sounding-out)

- S305-1: [curious] There were three letters on the door, C, A and T, and Ana knew each one. What she did not know was the word.
- S305-2: She said the letter names, [slowly] see, ay, tee, but that was not a word. It was just three names in a row.
- S305-3: [helpful] Say the sounds, said her brother, not the names. [slowly, stressing each sound] Cuh. A. Tuh. Say them slowly, and then say them faster.
- S305-4: [slowly, then faster] Cuh, a, tuh. Cuh-a-tuh, cuh-a-tuh, and then all at once, cat! [excited] Ana said it again, louder. Cat!
- S305-5: [a door creaking open] She opened the door, [a cat meowing] and there was the cat, sitting on the mat and looking up at her.
- S305-6: Ana went looking for more doors. D-O-G came out as duh-o-guh, [delighted] and then dog! [amused] There was no dog behind that one, but she read it anyway.
- S305-7: [slowly, warmly] Say each sound. Then say them fast together.

### Which way the finger goes (S308, which-way-we-read)

- S308-1: Theo put his finger on a page and moved it from right to left. The words came out backward, [robotic] tac and gid, and it sounded like a robot.
- S308-2: [frustrated] He tried starting in the middle, and that was even worse. He got half a word, and then nothing.
- S308-3: [gently] [a finger tapping a page] Start on the left, said his teacher, and she tapped the corner. Go to the right, and at the end of the line, hop down.
- S308-4: Theo started on the left. [slowly, reading] Cat. Dig. Now the words made sense, and at the end of the line he hopped down.
- S308-5: [steady, like a journey] Back to the left, then right again, line after line. The page had a road on it, and he was on the road.
- S308-6: [proud] He read the whole page, and then the next one. His finger knew the way now, even with his eyes closed.
- S308-7: [slowly, warmly] Start on the left. Go right. Then down to the next line.

### The card and the picture (S311, word-meanings)

- S311-1: [curious] Rosa had a card that said dog. On the table were three pictures, a dog, a sun and a fish. Where did the card go?
- S311-2: She put it on the sun. Her teacher smiled and shook her head. [gently] Not that one.
- S311-3: So Rosa said the word out loud. [slowly] Dog. She looked for the dog, and there it was, ears and a tail. [pleased] The card went on the dog.
- S311-4: [thoughtful] Then came sun. She said it, and looked for something round and yellow. There it was, so the card went on the sun.
- S311-5: Then fish, with its fins and scales. There. [delighted] Three cards on three pictures, all of them matched.
- S311-6: [proud] Her teacher gave her more cards, cat, hat and cup. Rosa said each word and found each picture, and she did not miss again.
- S311-7: [slowly, warmly] Match the word to the picture. Say it, then find it.

### Slants in the sand (S314, trace-slant-letters)

- S314-1: [waves rolling in] Jamal had a stick and a patch of wet sand. He drew a line straight down and a line straight across. Every letter he knew was made of those two.
- S314-2: His sister asked for a V. Jamal tried straight down and then straight across, but that was not a V. [giggles] That was an L.
- S314-3: [helpful] Slant, she said. Down a slant, then up a slant. Jamal tried it, and there was a point at the bottom. [delighted] A V!
- S314-4: Then came an A, with a slant up, a slant down and a line across the middle. [playful] It looked like a tent with a bar.
- S314-5: [slowly, tracing] Then came an N. It went down, then slanted, then went up. Three lines made an N, and slanted lines had made all three letters.
- S314-6: V, A, N. [a wave washing over sand] Then a wave came and washed them away. Jamal drew them again, bigger and farther up the beach.
- S314-7: [slowly, warmly] Slanted lines make V, A and N. Start at the dot.

### Ten and three (S317, teen-numbers)

- S317-1: [warm] Ten eggs filled the carton, in two rows of five. Three more eggs sat beside it, brown and speckled. Mia had to say how many.
- S317-2: [frustrated] She started counting from one, and by eight she had lost her place. The eggs all looked the same.
- S317-3: [a tap on a carton] Mom tapped the carton. This is ten, she said, and you do not need to count those again. [firmly, kindly] Ten is done.
- S317-4: [slowly, counting on] Ten, and then the three more, eleven, twelve, thirteen. Ten and three is thirteen.
- S317-5: [confident] Mia tried more. Ten and five was eleven, twelve, thirteen, fourteen, fifteen. Ten and seven was seventeen.
- S317-6: [thoughtful] Every teen number is ten and some more. The carton is the ten, and the loose eggs are the some.
- S317-7: [slowly, warmly] A teen number is ten and some more. Start at ten and count on.

### Two pockets (S320, adding-to-20)

- S320-1: Leo had marbles in both pockets, eight in one and six in the other. He wanted to know how many in all. He tried to count them inside his pockets, [amused] but pockets are dark.
- S320-2: [marbles clattering onto a rug] So he tipped them out onto the rug, eight in one pile and six in another. Blue ones, green ones, and one with a swirl.
- S320-3: [slowly] He could count them all from one, fourteen marbles one at a time, but that was slow.
- S320-4: His sister showed him a faster way. Start with the bigger number, eight, and then count on. [counting on, brisk] Nine, ten, eleven, twelve, thirteen, fourteen.
- S320-5: [delighted] Fourteen! It was the same answer, in six counts instead of fourteen. Leo put them all in the jar.
- S320-6: [pennies clinking] He tried it with pennies, nine and four. Nine, then ten, eleven, twelve, thirteen. It worked every time.
- S320-7: [slowly, warmly] Start with the bigger number. Count on from there.

### Birds on the wire (S323, subtracting-to-20)

- S323-1: [birds chirping on a wire] Fifteen small brown birds sat on the wire, and Ana counted them twice to be sure. Fifteen.
- S323-2: [wings flapping away] Then six flew away at once, flap, flap, off over the roof. [curious] How many were left?
- S323-3: [a little frustrated] Ana started to count all over again, but the birds kept hopping and moving. Counting from one was slow.
- S323-4: Grandpa said to count back. You had fifteen and six flew away, [slowly, counting back] so fourteen, thirteen, twelve, eleven, ten, nine. Six steps back.
- S323-5: [pleased] Nine! Nine birds were left on the wire. Ana counted them the slow way to check, and it was nine, the same answer.
- S323-6: Then two more flew off, so nine became eight, then seven. Seven birds. [a flurry of wings] Then all of them left at once, [amused] and that was zero.
- S323-7: [slowly, warmly] Take away by counting back. One step for each one gone.

### Bundles of ten (S326, tens-and-ones)

- S326-1: [sticks clattering] Sam had a pile of craft sticks, flat and smooth, and his teacher asked how many. He started counting one at a time, but the pile did not seem to get any smaller.
- S326-2: Then she handed him rubber bands. Ten sticks and one band made a bundle, so Sam counted ten [a rubber band snapping] and snapped a band on.
- S326-3: [steady] He made three bundles, and four sticks were left over, not enough for another bundle.
- S326-4: Three tens and four ones. Three, four. [delighted] Thirty-four! He read the number right off the bundles.
- S326-5: [confident] His friend had five bundles and two loose, fifty-two. Sam could read it without counting a single stick.
- S326-6: [thoughtful] Tens come in bundles and ones are the loose ones. Every number is some bundles and some loose sticks.
- S326-7: [slowly, warmly] Tens come in bundles. The ones are the loose ones.

### Two jars of buttons (S329, comparing-to-100)

- S329-1: [buttons rattling in jars] This jar had 62 buttons and that jar had 48. Rosa wanted the bigger one for her sewing. The jars looked the same size, and the numbers looked close.
- S329-2: [thoughtful] She did not want to count a hundred buttons twice, so there had to be a faster way.
- S329-3: [warm, wise] Grandma said to look at the tens first. Rosa made stacks of ten, and this jar had six stacks and two loose. Sixty-two.
- S329-4: That jar had four stacks and eight loose, forty-eight. [slowly, comparing] Six tens against four tens, and six is more.
- S329-5: Six tens is more than four tens, so the ones do not even matter. [sure] Sixty-two is bigger than forty-eight.
- S329-6: [pleased] Rosa took the big jar and sewed six buttons on her coat. That left fifty-six, which was still more than forty-eight.
- S329-7: [slowly, warmly] Look at the tens first. If the tens match, the ones decide.

### The five (S332, writing-numbers)

- S332-1: Lena wrote a five, and it looked like an S. She wrote it again and got an S with a hat. [teasing] Her brother said it was a snake.
- S332-2: [frustrated] A five has a place to start. Lena kept starting in the wrong spot, in the middle or at the bottom.
- S332-3: Her teacher drew a dot at the top. [gently] Start here, she said. Down, round the belly, lift, and across the top.
- S332-4: Lena tried it, [slowly, tracing] down, round, lift and across. [delighted] A five, and not a snake! A real five stood up straight on the page.
- S332-5: [thoughtful] Every number had its own dot. A two started at the top and curved. A seven started at the top and went across, then down.
- S332-6: Lena wrote a row of fives and then a row of sevens, all from their dots. [proud] No snakes.
- S332-7: [slowly, warmly] Every number starts at its dot. Follow the arrow.

### The word on the box (S335, read-the-word)

- S335-1: [curious] There were three letters on the box, M, A and P, and Kai knew them all. [slowly, letter names] Em, ay, pee. He said the names, but that was not a word.
- S335-2: [gently] Letter names do not make words, said Dad. Sounds do. He tapped the M and asked what sound it makes.
- S335-3: [slowly, each sound] Mmm. After that came the A, aaa, and then the P, puh. Kai said them one at a time. Mmm, aaa, puh.
- S335-4: Now push them together, said Dad. Kai slid his finger under the letters. [faster and faster] Mmm-aaa-puh, mmm-aaa-puh, map!
- S335-5: [a box opening, paper rustling] He opened the box, and inside was a map, a big folded one. The word had told him what was inside.
- S335-6: [excited] Kai looked for more boxes. C-U-P was cuh-uh-puh, cup, and there was a cup inside. He read every box in the garage.
- S335-7: [slowly, warmly] Say each sound. Push them together. Read the word.

### Shell, chair, thumb (S338, sh-ch-th)

- S338-1: [ocean waves] Ana found a shell, pink and curly, and held it to her ear. Then she tried to read the word on the sign. S, h, e, l, l. [puzzled] Sss-huh. That was not shell.
- S338-2: [thoughtful] Two of the letters were working as a team, and she was reading them one by one. That was the problem.
- S338-3: S and H together say shh, said Mom, like when you want quiet. [a soft shush] Shh. Shell.
- S338-4: [playful] Ana looked around. C and H together say ch, as in chair, so she sat in the beach chair. Ch.
- S338-5: [playful] T and H together say th, as in thumb, so she held up her thumb. Th. Two letters, one sound.
- S338-6: [waves, warmly] Shell, chair, thumb. Ana found all three on the beach, and she said them along with the sea.
- S338-7: [slowly, warmly] Sh, ch and th are two letters that say one sound.

### The quiet e (S341, silent-e)

- S341-1: Leo read cap, a hat, and put it on. Then he saw cape and read it cap-eh. [laughing] His sister laughed, because there was no eh.
- S341-2: [curious] The e at the end made no sound at all. So what was it for? Was it just sitting there?
- S341-3: [explaining] It was there to change the a. In cap, the a says aa, but in cape, the a says its name, ay. Cape.
- S341-4: [softly] The e was silent, and it worked by staying quiet. It reached back and changed the a.
- S341-5: [confident] Leo tried more. Kit became kite, and the i said its name. Tub became tube, and the u said its name. The quiet e did it every time.
- S341-6: [playful, swooping around a room] Leo put on the cape and flew around the room. Cape, not cap. He knew the difference now.
- S341-7: [slowly, warmly] A silent e at the end makes the vowel say its name.

### From the capital to the period (S344, read-the-sentence)

- S344-1: Rosa read the words one at a time. [flat, word by word] The. Dog. Is. Out. Four words, said like a list, and she did not know when to stop.
- S344-2: [thoughtful] A sentence is not a pile of words. It has a start and an end, and Rosa had to find both.
- S344-3: [gently] Start at the capital letter, said her teacher, the big T. Read across, and stop at the period, the little dot.
- S344-4: [smoothly] The dog is out. Rosa read it smooth, and now it was a sentence. It said something. [delighted] A dog was out!
- S344-5: [steady] The next line had a capital letter too, so she read across to the period. He ran to the park. That was another sentence.
- S344-6: Rosa read the whole page that way, capital, across, period, then capital, across, period. [warm, excited] The story came alive.
- S344-7: [slowly, warmly] A sentence starts with a capital letter and stops at a period.

### First, then, last (S347, what-happened)

- S347-1: Sam told the story of his kite. [jumbled, hurried] Dad got it down, it went up, it got stuck. [puzzled] His mom looked confused and asked what happened first.
- S347-2: [thoughtful] All of it was true, but it was in the wrong order, with the end at the start.
- S347-3: [wind blowing] Sam tried again. First, the kite went up, high in the wind. Then it caught in a tree and got stuck.
- S347-4: [clear, in order] Last, Dad climbed up and got it down. Three little words, first, then, last, and now the day made sense.
- S347-5: [pleased] Mom nodded, because she could see it now. Up, stuck, down, in that order.
- S347-6: [warm] Sam told the story again at dinner, first, then, last, and everyone understood it the first time.
- S347-7: [slowly, warmly] First, then, last. Tell what happened in order.

### Tails, bumps and zigzags (S350, tracing-more-small-letters)

- S350-1: Mia traced a g and kept its tail on the line. [amused] It looked like a q with a hat. Her teacher smiled.
- S350-2: [puzzled] Some small letters go below the line, some have bumps, and some zigzag. Mia did not know which was which.
- S350-3: A g has a tail, said her teacher, and it hangs below the line, so let it drop. Mia traced it, the tail hung down, [pleased] and there was a real g.
- S350-4: [slowly, tracing] An m has two bumps, up, over, up, over. Mia traced two round hills. A z zigzags, across, down, across.
- S350-5: [playful] Tails, bumps and zigzags. Mia found more: a y had a tail, an n had one bump, and a w zigzagged too.
- S350-6: She traced a whole row, every letter its own way. [proud] Her teacher put a star on the page.
- S350-7: [slowly, warmly] Tall sticks, bumps and zigzags. Start at the dot and follow the arrow.

### One line, then the rest (S353, trace-small-letters-3)

- S353-1: [a little frustrated] Kai traced an i and forgot the dot. He traced a t and forgot the bar. Both looked like the letter l, so he had three l's in a row.
- S353-2: [gently] Each one starts the same way, said his teacher, with one line down, and then something else. The something else was the part he kept forgetting.
- S353-3: One line down, then a dot on top, makes an i. Kai traced it. [delighted] Dot! Not an l anymore.
- S353-4: One line down, then a bar across, makes a t. Kai traced it. [delighted] Bar! And one line down, then a kick out, makes a k.
- S353-5: [rhythmic] Start the same, finish your own way. Kai said it as he traced, line and dot, line and bar, line and kick.
- S353-6: [proud] He traced a whole row of i, t and k, with no more l's. Every letter had its own finish.
- S353-7: [slowly, warmly] One line down, then the rest. Start at the dot.

### Curve, point, cross (S356, trace-small-letters-4)

- S356-1: [frustrated] Ana traced a c, and it came out as a circle. She traced a v, and it came out round, like a u. All she drew was round.
- S356-2: [gently] Not every letter is round, said her teacher. Some have points, and some cross. Ana looked at the letters again.
- S356-3: A c is a curve, like a cup on its side, open on the right. Ana traced it and stopped. [pleased] Not a circle, but a c.
- S356-4: A v goes down to a point and back up, sharp at the bottom. Ana made the point. [crisp] Sharp!
- S356-5: [slowly, tracing] An x is two lines that cross, one slant and then the other slant over it. An x, with nothing round at all.
- S356-6: [proud] Curve, point, cross. Ana traced them in a row, c, v, x, each one different and each one right.
- S356-7: [slowly, warmly] A curve, a point, a cross. Start at the dot.

### Line and arch (S359, trace-small-letters-5)

- S359-1: [curious] Sam traced an n, then a u, then an r. His teacher asked what they had in common, and Sam said nothing, because they looked different.
- S359-2: [thoughtful] He looked again. Each one had a line, and each one had a little arch. The arch went one way or another.
- S359-3: [slowly, tracing] A line down, then up and over, makes an arch, and that is an n. Sam traced it, down, up and over.
- S359-4: [slowly, tracing] Down, round the bottom, and up makes a u, an arch turned upside down. Sam traced it, down, round and up.
- S359-5: [slowly, tracing] A line down, then a small arch that stops, makes an r, just the start of an n. Sam traced it, down, a little arch, and stop.
- S359-6: Line and arch, three letters from one move. Sam wrote run, r, u, n, [delighted] all three in one word!
- S359-7: [slowly, warmly] A line, then a little arch. Start at the dot.

### The same place every day (S362, sun-moon-patterns)

- S362-1: [birds at dawn] Rosa woke early and saw the sun come up over the fence. The next day it came up over the fence again, and the next. [curious] Was it always the same fence?
- S362-2: [determined] She decided to check, every morning for a week. She made a chart with a sun for each day.
- S362-3: [steady] Every morning it rose in the east, over the fence. Every evening it set in the west, behind the far hill. Not once did it change.
- S362-4: [softly, night crickets] Then she watched the moon. One night it was a thin curve. A few nights later it was half, and a week after that it was round and full.
- S362-5: [slow, wondering] The moon changed shape a little each night, round, then thin, then round again. It was slow, but it was the same every month.
- S362-6: [proud] Rosa showed her chart to the class. The sun in the east, the sun in the west, and the moon getting round. Patterns that repeat.
- S362-7: [slowly, warmly] The sun and moon follow patterns that repeat.

### Ice, water, ice (S365, water-changes)

- S365-1: Leo left an ice cube on the step. It was hard, cold and slippery, but when he came back it was a puddle. [puzzled] Where did the ice go?
- S365-2: [gently amused] Nowhere, said Mom. It is right there. The sun warmed it, and heat melts ice into water.
- S365-3: [a freezer door opening and closing] Leo scooped the puddle into a tray and put the tray in the freezer. It was cold in there, very cold.
- S365-4: [amazed] In the morning it was hard again, an ice cube, the same water frozen back.
- S365-5: [thoughtful] Cold makes ice, and heat melts it back, round and round. The water never left. It just changed.
- S365-6: [playful] Leo tried a snowball next. Warm hands melted it into water, and the freezer froze it into ice again. He did it three times.
- S365-7: [slowly, warmly] Cold makes ice. Heat melts it back to water.

### What the puppy needed (S368, animal-needs)

- S368-1: [a puppy whining] The puppy whined, and Ana did not know why. It had a collar, a name and a squeaky toy, and it still whined.
- S368-2: [gently] A puppy needs more than a name, said Dad. Think about what you need every day.
- S368-3: [eager] Food! Ana filled the bowl, [crunching] and the puppy ate, crunch, crunch, and then it whined again. [eager] Water! Ana filled the dish, and the puppy lapped and lapped.
- S368-4: It was still tired, so Ana made it a soft bed in the corner. A blanket, a pillow, a home. [softly] The puppy curled up there and slept.
- S368-5: [relieved] Fed, watered and rested, the puppy stopped whining. It had what it needed.
- S368-6: [warm] Every morning after that, Ana checked three things, the bowl, the dish and the bed. Food, water and a home. The puppy grew big and happy.
- S368-7: [slowly, warmly] Animals need food, water and a home.

### Near and far (S371, leaders-near-and-far)

- S371-1: [curious] Kai heard about a mayor, a governor and a president, all in one day. Three leaders, and he thought they all did the same job.
- S371-2: [explaining] They do the same kind of job, said his teacher, for places of different sizes. Small, medium and big.
- S371-3: [warm] The mayor leads the city, and that is near. Kai could walk to the town hall, and the mayor had cut the ribbon at his park.
- S371-4: The governor leads the whole state, which is bigger, [emphatic, proud] and Texas is huge. That is farther. The president leads the whole country, and that is far.
- S371-5: [a pencil drawing] Kai drew three circles. A small one was for the city, and a bigger one around it was for the state. The biggest was for the country.
- S371-6: The mayor went in the small circle and the governor in the middle. The president went in the big one. [slowly] Near, farther, far.
- S371-7: [slowly, warmly] Mayor for the city, governor for the state, president for the country.

### The hat and the haircut (S374, goods-and-services)

- S374-1: [a busy street] Mia bought a hat and got a haircut on the same street. Both cost money and both came from a shop. Only one of them went home in a bag.
- S374-2: [puzzled] The haircut was not a thing she could hold, so what had she paid for?
- S374-3: The hat was a good, a thing you can hold, put on, take off and keep. [a bag rustling] Goods go in bags.
- S374-4: The haircut was a service, work someone did for her. [scissors snipping] Snip, snip. She could not put it in a bag, but she had it.
- S374-5: [warm] Both were paid for with money, and money comes from work. Mom worked at the bakery, and that paid for the hat and the haircut.
- S374-6: [pleased] Mia looked down the street. The toy shop sold goods and the car wash sold a service. She could tell them apart now.
- S374-7: [slowly, warmly] Goods are things. Services are work done for you.

### Where the sun comes up (S377, maps-of-my-world)

- S377-1: [puzzled] Sam had a map of his yard, and it said north at the top. He turned it every way, and he still could not tell which way was which.
- S377-2: [patient] The map needed one true direction to start from, and Dad said to wait for the sun.
- S377-3: [morning birds] The sun rose over the fence, so that way was east. Sam faced the sun and turned the map until its east side pointed at the fence.
- S377-4: [slowly, turning] Now north was on his left, where the tree stood. South was on his right, by the door. West was behind him. Four directions, like a cross laid over the yard.
- S377-5: [proud] Sam drew the cross on the map, north, south, east and west. Now he would never have to wait for the sun again.
- S377-6: He walked the yard, north to the tree, east to the fence and south to the door. Then west, back toward the house. [satisfied] The map matched the world.
- S377-7: [slowly, warmly] North, south, east, west. The sun rises in the east.

### The sign that stopped everyone (S380, signs-around-town)

- S380-1: [cars braking at a stop sign] Rosa watched a red sign with eight sides, and every car that came to it stopped. Nobody told the drivers to. [curious] How did they all know?
- S380-2: [explaining] The sign told them, all of them at once, and that is what signs do.
- S380-3: [steady] A stop sign says stop, in red, with eight sides. A green sign says the street's name, like Oak Street, that way.
- S380-4: [careful] A yellow sign says to slow down, because something is ahead. This one had children on it, so a school was ahead.
- S380-5: [confident] Rosa read the signs all the way home, stop, Oak Street and school. She knew what each one meant.
- S380-6: Then she made a sign for her room, red with eight sides, and it said stop. Her brother stopped at the door. [triumphant, giggling] It worked.
- S380-7: [slowly, warmly] Signs tell everyone the same thing at once.

### The bell and the torch (S383, symbols-of-our-country)

- S383-1: [curious] Leo saw a picture of a bell with a big crack in it. Why keep a broken bell? His teacher said it was famous.
- S383-2: [puzzled] Famous for what? A crack is a crack, and Leo did not get it.
- S383-3: [a distant bell ringing] The Liberty Bell rang for freedom, long ago, and people came to hear it. The crack came later, and they kept the bell anyway.
- S383-4: [harbor waves, gulls] The Statue of Liberty holds up a torch to welcome people. She stands in the harbor, green and tall.
- S383-5: [respectful] The Alamo is an old mission in Texas where Texans fought, and people remember what happened there. And the flag stands for the whole country.
- S383-6: [proud] Each one stands for something bigger than itself. Leo drew all four, the bell, the torch, the mission and the flag.
- S383-7: [slowly, warmly] The bell, the statue, the Alamo and the flag stand for us.

### The sound at the end (S1172, ending-sounds)

- S1172-1: [curious] Sam could hear the start of cat, cuh, but he could not hear the end. It went by too fast. [quickly] Cat, and it was gone.
- S1172-2: His dad told him to say it slowly. Sam said cat. [slowly, teasing] Slower, said his dad, like a snail.
- S1172-3: [very slowly] Caaat. There it was, a little tuh at the very end. His tongue tapped behind his teeth to make it.
- S1172-4: Then came bus. Busss. The last sound was sss, a hiss like a snake.
- S1172-5: [slowly, stressing the last sounds] Then dog, with guh at the end. After that came cup, and his lips popped on the puh at the very end.
- S1172-6: Sam said every word in the kitchen slowly. Pan ended in nnn, spoon ended in nnn, and fork ended in kuh. [proud] He found every ending.
- S1172-7: [slowly, warmly] Say the word slowly. The last sound is the ending sound.

### The glitter (S1226, washing-hands)

- S1226-1: [water running] Mia had gold glitter on both hands from art class. She rinsed them with water, and some of the glitter stayed.
- S1226-2: [puzzled] Rinsing was not enough, because the glitter hid between her fingers and around her thumbs.
- S1226-3: [scrubbing, counting] So she used soap and counted to twenty. She scrubbed between the fingers, around the thumbs and under the nails. [pleased] Then it was gone.
- S1226-4: [gently] Germs are like glitter, said the nurse. You cannot see them, but they hide in exactly the same places.
- S1226-5: [steady] Mia washed before lunch and after the bathroom, with soap, a count to twenty and a rinse.
- S1226-6: [humming a tune] She sang a song while she counted. By the time she reached twenty, the song was done and her hands were clean.
- S1226-7: [slowly, warmly] Wash with soap before eating and after the bathroom. Count to twenty.

### The fence of teeth (S1229, brushing-teeth)

- S1229-1: [quick brushing] Leo brushed fast, front teeth only, and he was done in ten seconds. Then he ran off to play.
- S1229-2: His dentist looked in his mouth. [playful, mock-serious] The back pickets are unpainted, she said, on both sides.
- S1229-3: [explaining] Teeth are like a fence, and every picket needs paint on both sides. Front and back, top and bottom.
- S1229-4: It takes two minutes. [slowly, counting] Top right, top left, bottom left, bottom right, with thirty seconds for each corner.
- S1229-5: [a timer ticking] Leo set a timer, and two minutes felt long. But he brushed every corner, front and back.
- S1229-6: He did it morning and night, two times a day. When his dentist looked again, [proud] every picket was painted.
- S1229-7: [slowly, warmly] Brush two times a day for two minutes. Every tooth, both sides.

### The phone and the boy (S1232, sleep-k)

- S1232-1: [a quiet night] The phone charged all night, plugged in and quiet. Sam stayed up, playing, then reading, then just looking at the ceiling.
- S1232-2: In the morning the phone was at a hundred. Sam was at about fifty, and grumpy, [yawning] and he yawned all through breakfast.
- S1232-3: [gently] Kids need ten to twelve hours of sleep to fill up, and Sam had gotten six. His battery was low.
- S1232-4: That night Sam went to bed earlier, with the same quiet steps in the same order. [softly] A bath, a book, and lights out.
- S1232-5: He slept ten hours, and in the morning he bounced out of bed. [energetic] A hundred percent!
- S1232-6: [warmly] The phone charges every night, and so does a boy. After that, Sam plugged himself in on time.
- S1232-7: [slowly, warmly] Ten to twelve hours of sleep. The same quiet routine each night.

### The rainbow plate (S1235, my-plate)

- S1235-1: [playful] Ana's plate was all one color, beige. Bread, crackers and more bread, and she ate it all.
- S1235-2: Her tummy was full, but her mom shook her head. [gently] A plate of one color is missing a lot.
- S1235-3: Mom made a new plate with red tomatoes, orange carrots, green peas and purple grapes. [delighted] It was a rainbow.
- S1235-4: [steady] Half the plate was all colors, and the other half was bread and chicken. A glass of water sat beside it.
- S1235-5: [crunching] Ana ate the rainbow, crunch and pop and sweet. Every color brought something her body needed.
- S1235-6: Every day after that, Ana looked at her plate to see if there was a rainbow. If there was not, [playful] she asked for one.
- S1235-7: [slowly, warmly] Half the plate is fruits and veggies, with water to drink.

### The clock in the song (S1250, the-steady-beat)

- S1250-1: [a clock ticking] Tick, tick, tick. The clock on the wall kept time, and Mia tapped along on her knees. Then the music teacher played a song and told her to keep tapping.
- S1250-2: [confused] The song had lots of notes, fast ones and slow ones. Mia did not know where to tap.
- S1250-3: [gently] Listen under the notes, said the teacher. There is a pulse down there, even, like the clock.
- S1250-4: Mia listened, and there it was. [steady tapping] Tap, tap, tap, steady, under it all. The beat.
- S1250-5: [delighted] She found it and tapped it. The notes danced on top while the beat stayed steady underneath.
- S1250-6: Every song had a clock inside it. [a radio playing, tapping along] Mia tapped the beat to the radio all the way home.
- S1250-7: [slowly, warmly] The beat is the even pulse under a song, like a clock.

### Bird high, cow low (S1253, high-and-low)

- S1253-1: [a bird tweeting, a cow mooing] The bird sang, tweet, and the cow mooed, moo. Kai said they were the same sound, but his sister said one was high and one was low.
- S1253-2: [puzzled] What did high and low mean for a sound? A sound was not up or down, and Kai did not get it.
- S1253-3: [piano notes climbing] Inside, on the piano, Kai walked his fingers to the right. The notes climbed higher and higher, toward the bird.
- S1253-4: [piano notes sinking] Then he walked his fingers to the left, and the notes sank lower and lower, toward the cow.
- S1253-5: [understanding] High and low is pitch. The bird was high and the cow was low, and Kai could hear it now.
- S1253-6: He played a bird way up on the right, and then a cow way down on the left. [laughing] His sister laughed.
- S1253-7: [slowly, warmly] High and low is pitch. On a piano, right is higher.

### The drum and the lullaby (S1256, loud-and-soft)

- S1256-1: The parade drum was so loud that Ana covered her ears. [a loud parade drum] Boom! Boom! [very softly] That night her mom sang a lullaby so soft that Ana could barely hear it.
- S1256-2: [curious] Why not sing loud too? Ana asked. Mom smiled and said that loud and soft are for different jobs.
- S1256-3: [bold] The drum had to reach the whole street, everyone at once, so it was loud.
- S1256-4: [softly] The lullaby had to reach one sleepy girl, just Ana, so it was soft.
- S1256-5: [explaining] A song can grow louder or fade away, and that is called dynamics. Loud, soft, and all the steps between.
- S1256-6: [whispering] Ana sang to her doll, soft as a whisper. [a pot lid banging] Then she marched with a pot lid, loud as a drum. Both were right.
- S1256-7: [slowly, warmly] Loud and soft is dynamics. A song can grow louder or fade.

### The quiet tablet (S2702, tell-and-show)

- S2702-1: [curious] Nia got a tablet for her birthday, and it sat on the table doing nothing. The screen was dark and quiet, and she waited for it to start.
- S2702-2: [a big brother, helpful] It cannot start on its own, said her brother Sam. You have to tell it something first.
- S2702-3: So Nia tapped the screen with one finger. [a soft chime, a little tune] A picture of a cat lit up, and a small song played from the speaker. Tap, and it shows, said Sam. The tapping part is an input.
- S2702-4: The screen and the speaker are outputs, because they show you things. [drum beats] Nia tapped a drum picture next, and the tablet played a drum. She tapped it again and again [giggles] and laughed every time.
- S2702-5: [keys clicking] Then Sam showed her the keyboard, and she typed her name one letter at a time. Each letter she pressed showed up on the screen, big and blue.
- S2702-6: [slowly, warmly] A tablet does not know what you want until you tell it. Inputs tell. Outputs show.

### Shoes before socks (S2707, first-next-then-last)

- S2707-1: [hurried] Leo was in a hurry to get to the park. He grabbed his shoes and pushed his feet in, and then he reached for his socks.
- S2707-2: The socks would not go on over the shoes. He pulled and pulled, [a rip] and one sock ripped. [grumpy] Leo sat down on the floor and frowned.
- S2707-3: His dad came in and looked at the shoes. [gently, amused] You did the steps, he said, but not in order. Socks first, then shoes.
- S2707-4: Leo took the shoes off and started again. [brisk, counting steps] First socks. Next shoes. Then his coat, and last, out the door. It took one minute.
- S2707-5: [birds in a park] At the park he made a sandwich with his dad. First bread, next jam, then close it, last a bite. [pleased] It tasted better in order too.
- S2707-6: [slowly, warmly] Steps in order have a name. They are called an algorithm. First, next, then, last, and the socks go on every time.

### Clap four times (S2712, do-it-again)

- S2712-1: Miss Ada wrote a dance for the class robot on the board. [clapping] Clap. Clap. Clap. Clap. Turn. The list filled the whole board, [a marker squeaking dry] and her marker ran dry.
- S2712-2: Priya raised her hand. [eager] There is a pattern, she said. Clap comes four times, and then one turn.
- S2712-3: [a board being wiped] Miss Ada smiled and wiped the board clean. She wrote two short lines instead, clap four times and then turn. A loop, she said, does the same step again and again.
- S2712-4: [a robot whirring, four claps] The robot read the two lines and clapped four times. It turned, [children cheering] and the class cheered, because the dance was exactly the same.
- S2712-5: [excited] Then the class wrote a bigger dance with loops: jump three times, spin two times, clap four times. It fit on one small card.
- S2712-6: [slowly, warmly] A pattern tells you what comes next. A loop says do it again, and says how many times.

### The secret word (S2717, safe-online-k)

- S2717-1: [proud] Omar got his very first account on the class computer, with a password all his own. It was a secret word, and it opened his page.
- S2717-2: A boy named Ben asked what the word was. [hesitant] Omar almost said it, and then he stopped. Only a parent or a teacher may know it.
- S2717-3: [friendly] It is a secret, Omar said. Ben shrugged, and they went to play instead.
- S2717-4: [a game chiming] Later a game asked Omar to type his address to win a prize. He knew that his address was private, so he stopped and told his teacher. [warmly] She said he did exactly the right thing.
- S2717-5: [a school bell ringing] When the bell rang, Omar logged off, so the next person could not get into his page. He felt like the keeper of a small key.
- S2717-6: [slowly, warmly] Keep your password secret. Keep private things private. Be kind, and tell a grown-up.

### One coin, two wants (S2770, wants-needs-and-choices)

- S2770-1: [a busy school fair] Rosa had one shiny coin for the school fair. She walked past the balloons, and then past the sparkly rings, and stopped.
- S2770-2: She wanted a balloon. She wanted a ring too. [torn] But the coin could buy only one thing.
- S2770-3: [gently] Her big brother Luis knelt down beside her. You have to choose, he said. When you pick one, you let the other go.
- S2770-4: Rosa held the coin for a long time. [decided] Then she chose the ring, because a balloon can pop and a ring can stay. She gave the coin to the man and slid the ring on her finger.
- S2770-5: At the gate she saw the balloons again, [wistful] and she felt a little sad. Luis said that was normal. Giving something up is part of choosing.
- S2770-6: [slowly, warmly] Needs come first, and wants wait. One coin, two wants. You pick one and let the other go.

### The dog walk (S2775, earning-income)

- S2775-1: [hopeful] Kofi wanted a kite, and kites cost coins. [a dog barking happily] Miss Ito next door had a dog named Pepper who needed a walk every day.
- S2775-2: [eager] I will walk Pepper, Kofi said. Miss Ito said yes, and she said the job had rules. Be on time, hold the leash tight, and bring Pepper home dry.
- S2775-3: Every day Kofi came at four. [a leash tugging] Every day Pepper pulled, and Kofi held on. [coins clinking] At the end of the week Miss Ito gave him five coins. That was income, money he had earned.
- S2775-4: On Sunday his aunt came to visit and gave him two coins in a card. Kofi put them in the jar too. [gently] But those were a gift, his aunt said. You did not work for them.
- S2775-5: [proud] By the end of the month the jar held enough for the kite. Kofi knew which coins he had earned and which had been given. Both bought the kite, but only one had been work.
- S2775-6: [slowly, warmly] Work earns income. A gift is not income. Skills like being on time get you the job.

### Two coins a week (S2780, spending-and-saving)

- S2780-1: [longing] Amara wanted a red scooter. It cost more coins than she had ever seen in one place. So her mother gave her a jar and a plan.
- S2780-2: Every week Amara earned three coins for setting the table. [coins dropping into a jar] Two coins went in the jar, and one coin was hers to spend. Putting coins in the jar was a deposit.
- S2780-3: The jar filled slowly. [slowly, counting] Two, then four, then six, then eight. Amara taped a picture of the scooter on the front, and the picture got closer every week.
- S2780-4: One day she took three coins out to buy a birthday card for her friend. Taking coins out is a withdrawal. [thoughtful] The jar went down, and then it went up again.
- S2780-5: By the end of the summer the jar was full. Amara spent it on the scooter. [a scooter rolling, joyful] She rode it up and down the street until the sun went down.
- S2780-6: [slowly, warmly] Spending is now. Saving is for later. A deposit puts money in, a withdrawal takes it out, and saving adds up.

### The sticker market (S2785, trading-and-markets)

- S2785-1: [classroom buzz] On Friday the class had a trading day. Diego brought stickers, Lena brought marbles, and Sam brought tiny toy cars.
- S2785-2: A trade is a swap, Miss Ray said. You give one thing and get one thing. [pleased] Diego gave Lena two stickers and got one blue marble.
- S2785-3: Then Sam wanted a sticker, but Diego did not want a car. [stuck] They had nothing to swap. [explaining] That is why people use money, Miss Ray said. Everyone takes money.
- S2785-4: [a shop bell] After lunch the class went to the school store, which is a market with a roof. A pencil cost 2 coins. A small ball cost 4. Diego had 3 coins in his pocket.
- S2785-5: He could buy the pencil and have 1 coin left, but he could not buy the ball yet. Not enough coins means save more, or choose something else. [content] Diego chose the pencil and kept saving.
- S2785-6: [slowly, warmly] A trade is a swap. A market is where buyers meet sellers. The price is the coins it takes.

### The orange that was not there (S2886, lines-shapes-and-colors)

- S2886-1: [disappointed] Nia wanted to paint a pumpkin, and there was no orange paint in the whole box. There was red, yellow and blue, and that was all.
- S2886-2: [calm, a little mysterious] Her art teacher did not look worried at all. He put a dab of red on the plate, and a dab of yellow beside it. Then he handed Nia the brush.
- S2886-3: [a brush swishing] Nia mixed them, round and round. The red and the yellow turned into orange, bright as a real pumpkin. [laughing] She laughed out loud. Two colors had made a third one.
- S2886-4: [excited] After that she could not stop. Blue and yellow made green for the stem. Red and blue made purple for the sky at night. Every mix was a small surprise.
- S2886-5: [playful] For the pumpkin's face she drew a zigzag mouth and two triangle eyes. She added a curved line for a smile under the zigzag. Lines and shapes, her teacher said, are the bones of a picture.
- S2886-6: [slowly, warmly] Red, yellow and blue can mix into many new colors. Lines and shapes hold the picture together.

### The picture on the wall (S2891, what-a-picture-says)

- S2891-1: [footsteps in a quiet hall] The class walked to the library to see the big picture on the wall. It showed a boat on a wide blue river, with a red sun going down.
- S2891-2: [curious] What does it show, asked Miss Lopez. A boat, said Omar, and Ana added the river, and Kofi added the red sun. All of them were right.
- S2891-3: How does it make you feel, she asked next. [calm] Omar said calm, because the water was so smooth and still. [softly] Ana said sad, because the boat was alone out there. Both of you are right, said Miss Lopez, and a picture can be two things at once.
- S2891-4: [wonder] On the walk back, Kofi began to see art all around him. On a cup in the coffee shop window. On a street sign with a painted bird. On a quilt hung over a fence.
- S2891-5: [warmly] People make art to show what they love, Miss Lopez said, and to make plain things beautiful. A cup does not need a bird on it. Someone wanted one there.
- S2891-6: [slowly, warmly] Ask a picture what it shows and how it feels. Then say your idea, and listen to a friend say theirs.

### The drum and the heartbeat (S2896, beat-and-sound)

- S2896-1: Ben put his hand on his chest the way the music teacher showed him. [a steady heartbeat] Thump. Thump. Thump. While he sat still, it kept the same steady pace.
- S2896-2: That is a steady beat, said the teacher. Music has one too. [a drum tapping a steady beat] She tapped a drum, tap, tap, tap, tap. [marching feet] The class marched around the rug in time.
- S2896-3: Then she asked Ben to clap his name. [clapping, quick, quick, slow] Ben-ja-min, three claps, quick, quick, slow. That was rhythm, the pattern of the words on top of the beat. Ana's name had two claps, and Kofi's had two.
- S2896-4: [a flute, high and soft] The teacher played a bird song on the flute, high and soft. [a big drum, low and loud] Then she hit the big drum, low and loud. Fast and slow, loud and soft, high and low, she said. Listen for each one.
- S2896-5: [silence] When the song stopped, nobody moved. The quiet was part of the music too. [softly] Ben could still feel the beat in his chest, going on and on.
- S2896-6: [slowly, warmly] The steady beat is always the same. The rhythm is the pattern of the words on top.

### Five voices (S2901, voices-and-instruments)

- S2901-1: [playful] On Friday the music room had a game. Say hello five ways, said the teacher. Everyone said hello in a speaking voice first, all together.
- S2901-2: [singing] Next they sang hello, high and sweet. [whispering] After that they whispered it, so soft it was almost silence. [calling out] They called it too, as if across a big yard. Last, the teacher said, now say it with your inner voice.
- S2901-3: [silence, then warmly] Nobody made a sound. Every child said hello inside their own head, and every child smiled. Five voices, the teacher said, and you have them all.
- S2901-4: After the game she played sounds, and the class guessed with their eyes closed. [a guitar, a flute, a drum] A guitar has strings you pluck, and a flute sounds when you blow. A drum sounds when you hit it. Three families of instruments, and each one had its own sound.
- S2901-5: On Monday the grown-ups came to hear the spring songs. The children sat still, listened with their ears, [applause] and clapped at the end. That, said the teacher, is what a good audience does.
- S2901-6: [slowly, warmly] Five voices, three families of instruments, and two rules for an audience: listen, and clap at the end.

### The stick (S3050, i-wonder)

- S3050-1: Noor found a stick at the park. [playful, a stick swishing] It was long and smooth and made a fine sword. [a big brother, sure of himself] Her brother Sami said a stick is not a toy. Toys come from a store.
- S3050-2: [curious] Noor asked him what he meant by toy. Sami thought hard and said a toy is a thing you play with. Noor held up the stick and said she was playing with it right now.
- S3050-3: [thoughtful] That is a wondering question, said their dad. Why the sky is blue is a finding question. You can look it up. What a toy is, you have to think about.
- S3050-4: Sami tried again. A toy is a thing you play with that came from a store, he said. [triumphant] But what about the box, said Noor. They played in a box all summer. Nobody bought it as a toy.
- S3050-5: [laughing] Sami laughed. But what about was a good test. Every time he said what a toy was, Noor found a hole. Long ago, their dad said, a man named Socrates asked questions all day. His friend Plato wrote them down.
- S3050-6: [slowly, warmly] Some questions you find out. Some questions you think about. Both are good questions, and a stick can be a sword either way.

### The blue shirt reason (S3056, because-k)

- S3056-1: Omar wanted to go outside, and he said so at circle time. Why should we go out, asked Miss Ruth. [proud, a little silly] Because my shirt is blue, said Omar.
- S3056-2: [a class laughing] Everyone laughed, and Omar laughed too, because his shirt really was blue. But that was not a reason, since it was not about going outside at all.
- S3056-3: Try again, said Miss Ruth. Omar thought. [brightly] Because the sun is out, he said, and we can run. That is a reason, she said. It is about going outside, and it is true.
- S3056-4: [gently] Then Lila said we should go out because she wanted to. Miss Ruth smiled and said that wanting is a wish, not a reason. A reason has to be about the thing.
- S3056-5: Omar had one more reason, and he said it would not rain. [curious] How do you know, asked Miss Ruth. Omar did not know, so the whole class walked to the window and looked out at the day. [delighted] The sky was clear and blue, like a shirt.
- S3056-6: [slowly, warmly] A reason is what comes after because, and it has to be about the thing. When you do not know, go and look.

### The talking stick (S3062, my-turn-your-turn)

- S3062-1: [warm] The class had a talking stick painted with stars. Whoever held the stick could talk, and everyone else had to listen with their ears.
- S3062-2: The question that day was what pet to get. Ben held the stick and said a fish, because a fish is quiet. [blurting out] Ava said a rabbit before the stick got to her, [softly] and Ben looked sad.
- S3062-3: Miss Ruth asked Ava to say Ben's idea back first. You think we should get a fish, because a fish is quiet, said Ava. [pleased] Yes, said Ben, that is it. Then Ava got the stick and said a rabbit is soft to hold.
- S3062-4: [thoughtful] Ben did not agree, but he did not say Ava was silly. He said he did not agree, because a rabbit can be shy. Ava thought about that. It was a good reason.
- S3062-5: When the stick came around again, Ava said she had changed her mind. A fish was better for a class, she said, and nobody said she lost. [warmly] Miss Ruth said it was brave, and the class got a fish.
- S3062-6: [slowly, warmly] One voice at a time. Say it back before you answer. And if a friend has a better reason, you can change your mind.

### Four cookies, two kids (S3068, fair-shares)

- S3068-1: Mia and her cousin Leo had four cookies on one plate. [cheeky] Leo took three, [indignant] and Mia said that was not fair, because two each is fair.
- S3068-2: Their grandma agreed. Equal shares, she said, the same for everyone. Leo gave one cookie back. [munching slowly] Then he ate his two very slowly, to make them last.
- S3068-3: [a thump and an ouch] Later Leo fell off the swing and hurt his knee. Grandma had one ice pack, and she gave it to Leo. [gently] Mia did not say that was unfair. Leo needed it, and she did not. That is fair too, by need.
- S3068-4: [a swing creaking] On the swing they took turns. Every turn was the same size, ten pushes each. A turn is a fair rule for a swing, Grandma said. Would you like it if it were you, is the test.
- S3068-5: At snack time there was one cake left. Grandma gave Mia the knife and said the cutter picks last. [carefully] Mia cut the cake with great care into two even pieces. [playful] Leo picked first, and it did not matter which piece he took.
- S3068-6: [slowly, warmly] Equal shares are fair. More for the one who needs it is fair too. And when you cut the cake, the cutter picks last.

### Five reporters (S3146, my-brain-and-senses)

- S3146-1: [warm, a grandma telling a secret] Leo's grandma said his brain was the boss of him. It had five reporters, she said. They tell the boss the news.
- S3146-2: Leo tried them. His nose reported cookies in the oven. [a doorbell ringing] His ears reported the doorbell. His eyes reported his uncle at the door with a big box.
- S3146-3: [a puppy yipping] Inside the box was a puppy. Leo's skin felt its soft fur, and his tongue tasted a cookie at the same time. Five reporters, all at once, said Grandma, [delighted] and the boss was very happy.
- S3146-4: [a puppy whining softly] That night the puppy whined in the dark, and Leo saw a shape by the door. [whispering, a little scared] A monster, said his brain. [relieved] Grandma turned on the light, and it was the puppy's bed. The eyes reported a shape, she said. The brain guessed wrong.
- S3146-5: [yawning] Leo yawned. A tired brain guesses wrong more, said Grandma, and it gets grumpy too. A boy your age needs about ten to twelve hours of sleep. [softly] She tucked him in with the puppy nearby, and the boss went to sleep.
- S3146-6: [slowly, warmly] Five senses tell the brain the news. The brain decides, and now and then it guesses wrong. Sleep helps the boss get it right.

### Three at a time (S3152, remember-it)

- S3152-1: [frustrated] Mina could not remember her phone number. Ten numbers is a lot. Her dad said the brain holds only a few things at a time.
- S3152-2: First, said Dad, look and listen. [a TV clicking off] He turned off the TV. If your eyes are on the TV, the number does not go in.
- S3152-3: [slowly, clearly] Then he broke the number into three small pieces and said the first piece slowly. Mina said it out loud, because saying it puts it in deeper.
- S3152-4: [steady, day by day] On Monday she learned the first piece. On Tuesday she said it again and learned the second. On Wednesday she added the third. A little every day, said Dad.
- S3152-5: [a little worried] On Thursday she forgot the middle piece, and Dad said that was normal. [reassuring] Forgetting just means say it again, so she said it three more times.
- S3152-6: [a phone ringing] On Friday Mina said all ten numbers to her grandma on the phone. Look and listen, say it again, a little every day. [proud] Her brain had kept it.

### The name of the feeling (S3158, my-feelings)

- S3158-1: Sam built a block tower as tall as his chest. [blocks crashing] His baby sister knocked it down. [upset] Sam felt hot all over and did not know what to do.
- S3158-2: His teacher, Miss Bell, had said every feeling has a name. Sam looked for the name and found it. [firmly] I am angry, he said out loud.
- S3158-3: Saying it made the feeling a little smaller. Then he did what Miss Bell had shown the class, [a slow breath in and out] breathing in slow and breathing out slow. Five times he did it, [calmer] and his hands stopped being tight.
- S3158-4: The feeling said the tower was ruined for good. [gently] But a feeling is not a fact. The blocks were fine. They were just on the floor.
- S3158-5: Sam told his dad about the hot feeling and the slow breaths. Dad said that was smart, not weak. Then they built the tower again, [a baby giggling] and this time the baby helped.
- S3158-6: [slowly, warmly] Every feeling has a name. Say the name, breathe slow, and then decide what to do.

### Hello, my name is (S3164, making-friends)

- S3164-1: [playground noise] Ana was new at school and did not know one name. [shy] At recess she stood by the fence and watched. Then she thought of what her mom had said.
- S3164-2: Say hello and your name, then ask what they like and ask to play. [brave] Ana walked up to a boy with a red ball and said her name. The boy, Kai, liked soccer, and asked if she wanted to play.
- S3164-3: They played all week. On Friday, another boy told Ana to skip the lunch line with him. That is mean to the kids waiting, [firm] so Ana said no. A good friend helps you be kind.
- S3164-4: On Monday Ana and Kai both wanted the ball, [two kids arguing] and they yelled. [calm] Then Ana used the words. I felt sad when you grabbed the ball, and I want a turn. Kai listened. He gave her the ball.
- S3164-5: [warm] A girl named Rosa learned words more slowly than the rest, and Kai waited for her every time. Everyone is different, said the teacher, and everyone gets respect. Kai, Ana decided, was a good friend.
- S3164-6: [slowly, warmly] Say hello and your name. Be kind, tell the truth, and take turns. When you fight, say what you feel and what you want.

### Get your coat (S3242, my-listening-body)

- S3242-1: [dreamy] Milo was thinking about lunch. His teacher said, get your coat and line up. [dreamy, sing-song] Milo heard lunch, lunch, lunch, and he got his hat.
- S3242-2: Miss Ruiz smiled and asked where his coat was. Milo did not know what she had said. So he asked her. [politely] Can you say it again, please?
- S3242-3: Miss Ruiz said it again, get your coat and line up. [focused] This time Milo looked right at her. His hands were still, and his mind was on the words. He got his coat.
- S3242-4: At recess Miss Ruiz asked, did you like the slide? Milo answered with more than one word. Yes, I went down it three times, he said. [laughing] Miss Ruiz laughed.
- S3242-5: After the story that afternoon, Milo said it back. First the bear was hungry, and last the bear found honey. [proud] He had heard the whole thing.

### Cup, water, table (S3247, first-then-do)

- S3247-1: [snack time chatter] It was snack time, and Miss Ruiz gave Lena three steps. First, get a cup, and then fill it with water. Last, put it on the table where you sit.
- S3247-2: Lena said the steps back to her, [slowly] cup, water, table. Miss Ruiz nodded. The steps were in Lena's head now, in order.
- S3247-3: [water pouring] Lena got a cup and filled it with water. She carried it to the table and set it down. First things first, and last things last. [pleased] Nothing spilled.
- S3247-4: [confident] Then it was Lena's turn to give directions. She told Ben two steps. First, get the ball, and then roll it to me. Now you say it, Ben.
- S3247-5: [mixed up, playful] Ben said, roll the ball and then get it. Lena fixed it for him: get it first, then roll it. Ben said it right, [a ball rolling] and the ball rolled all the way to Lena.

### This is my dog (S3252, my-clear-voice)

- S3252-1: It was Theo's turn to tell. He held up his drawing of his dog [very quietly] and said, this is my dog. [gently] Nobody in the back could hear him.
- S3252-2: Miss Ruiz said, talk to the friend at the back. Theo looked at Priya in the back row and said it again, louder. [loud and clear] This is my dog.
- S3252-3: [clear, steady] Theo told the three parts. This is my dog. He is brown and he likes to dig. I like him because he is funny. Everyone could hear.
- S3252-4: He said whole words, slow. [slowly, clearly] He said dig, not di, and funny, not fun. Priya in the back smiled.
- S3252-5: [warm] Theo held his drawing up for the digging part. Then he put it down and looked at his friends. They were the ones he was talking to.

### The hand that waited (S3257, my-turn-and-kind-words)

- S3257-1: Ava wanted the red truck, but Ben had it. [a toy snatched, a child crying] Ava grabbed it, and Ben cried. Ava did not get the truck.
- S3257-2: Miss Ruiz sat with them and said, say it in words, Ava. Ava tried. [politely] I want a turn with the truck, please. Ben said, okay, when I am done.
- S3257-3: [a quiet circle] At circle time, one person talked at a time. Ava had an idea, so she put her hand up and waited. Two friends went first. Then it was Ava's turn, and everyone listened.
- S3257-4: A new boy came to class after lunch, and Ava walked over to him. [friendly] Hello, my name is Ava. The new boy said, my name is Sam. Now they knew each other.
- S3257-5: At the end of the day, Ben brought Ava the red truck. [grateful] Thank you, Ava said. Kind words had opened the door.

### Lunch from the garden (S3334, plants-we-eat-k)

- S3334-1: [birds in a garden] Rosa helped her grandpa pick lunch from the garden. [a carrot popping out of the soil] First she pulled a carrot out of the dirt. It was orange and long, because a carrot is a root that grows under the ground.
- S3334-2: [leaves rustling] Next they picked lettuce. Grandpa said lettuce is leaves. Rosa tore off the big green leaves and left the small ones to grow.
- S3334-3: [curious] The broccoli looked like a tiny green tree. Grandpa showed her the bumps on top. Each bump was a flower bud that had not opened yet.
- S3334-4: Rosa picked a red tomato, and Grandpa cut it in half. [amazed] Inside were lots of little seeds. A tomato is a fruit, he said, and each seed could grow a new tomato plant.
- S3334-5: They made a big salad with a root, leaves, flower buds and a fruit. Rosa ate every plant part, [happy] and she asked for more carrots.

### The bean in the cup (S3339, seed-to-plant-k)

- S3339-1: [gentle] Leo pushed a bean seed into a clear cup of soil and gave it a drink. He put the cup in a warm spot and waited.
- S3339-2: [amazed, quiet] After a few days, the seed opened. Leo could see a tiny white root through the cup, going down into the soil. A green shoot came up next.
- S3339-3: Now it was a seedling. Leo moved it to a sunny window, because a plant needs sunlight, water and air to grow. [softly] Its leaves turned toward the light.
- S3339-4: [outdoors, birdsong] The cup got too small, so Leo moved the bean to the garden, where it had room. It grew tall and made little white flowers.
- S3339-5: The flowers turned into green pods. Leo opened one, and inside were new beans just like the one he planted. [delighted] The bean plant had made more beans!

### The red barn (S3344, farm-animals-k)

- S3344-1: [a cow mooing] Maya visited a farm with a big red barn. A brown cow looked at her, and its ears turned toward her voice. Cows can see almost all the way around.
- S3344-2: [hens clucking] The hens were busy pecking at seeds on the ground. Their beaks picked up the seeds one at a time, quick as a wink.
- S3344-3: [a goat bleating] A goat stretched its neck over the fence. It grabbed a leaf with its lips and chewed it slowly [laughing] while Maya laughed.
- S3344-4: [rain starting, thunder far off] Then dark clouds rolled in, and it began to rain. The farmer led the animals into the barn, where it was dry. A barn is shelter, and every farm animal needs it.
- S3344-5: Before Maya left, the farmer gave her a brown egg from a hen. [softly, amazed] It was still warm. Maya held it with both hands all the way home.

### Up with the sun (S3349, a-day-on-the-farm-k)

- S3349-1: [a rooster crowing at dawn] Sam's mom is a farmer, and her day starts before the sun comes up. First she feeds the cows and fills their water.
- S3349-2: [thoughtful] Then she looks at the sky. Rain today means the corn gets a drink, so she will not need the hose. On hot days, she waters the garden every evening.
- S3349-3: [a truck rumbling up] At noon, a big truck comes for the milk. The milk goes to a dairy and the store, and soon it is on tables in town.
- S3349-4: [a quiet evening, crickets] In the evening, Sam sees a deer at the edge of the woods. Nobody feeds the deer, his mom says. It finds its own food, but our cows count on us.
- S3349-5: At the store the next day, Sam finds milk from his mom's farm. [proud] He points at the carton and grins, because he knows just where it came from.

### Mom at the bakery (S3426, earning-money-k)

- S3426-1: [a bakery bell, early morning] Nia's mom is a baker at the little shop on the corner of Pine Street. She gets up early.
- S3426-2: At the shop, Mom measures flour and salt with great care. [serious, a little playful] Too much salt spoils a loaf. Measuring is a skill her job needs, and so is getting there on time.
- S3426-3: [explaining] People buy the bread, and the shop pays Mom for her work. That pay is called income. Mom uses her income to buy food for the family and to pay for their home.
- S3426-4: On her birthday, Nia got a card from Grandpa with five dollars inside. [curious] Was that money income? [gently] Mom shook her head and smiled. Nia did not do a job for that money, so it was a gift.
- S3426-5: [playful] That night Nia sold pretend bread to her bear, who paid with buttons. Someday, she said, she would earn real income too.

### Two lists on the fridge (S3431, wants-and-needs-k)

- S3431-1: [a quiet kitchen] On Saturday, Leo and his dad sat at the kitchen table with two sheets of paper. One said Needs, and the other said Wants.
- S3431-2: [steady] On the needs list, Dad wrote food, water, warm coats and the rent for their home. Those are things a family must have to live and be well.
- S3431-3: Leo got to fill in the wants list. He wrote a red kite, a game, a puppy [dreamy] and a trip to the moon. [laughing] Dad laughed at the last one.
- S3431-4: [thoughtful] Dad's pay comes in each week, and it does not stretch forever. So the needs list gets paid first, every single time. If money is left over, the family picks one want.
- S3431-5: This week there was enough for one want, and Leo chose the red kite. [wind, a kite flapping] He flew it in the park on Sunday, and it was the best want of all.

### Three jars on the shelf (S3436, save-spend-share-k)

- S3436-1: [warm] Maya has three jars on her shelf, and each one has a word on it. The words say spend, save and share.
- S3436-2: Each week, Maya earns three dollars for feeding the cat and folding towels. [coins dropping into jars] She puts one dollar in each jar.
- S3436-3: [steady] The spend jar buys small things, like a sticker or a pencil. The save jar is for something bigger. One dollar each week adds up, and after five weeks Maya had five dollars.
- S3436-4: [a quiet bank] When the save jar was full, Maya and her mom took it to the bank. Putting money in the bank is called a deposit. Later, taking some out is called a withdrawal.
- S3436-5: The share jar was the one Maya loved best. She gave it to the animal shelter, [a dog barking softly] where it helped buy food for a shy brown dog.

### The bookmark shop (S3441, borrow-and-make-k)

- S3441-1: [careful] Ben borrowed his friend Sam's blue marker to make a sign for his bookmark shop. He used it with care and put the cap back on each time.
- S3441-2: [pleased] The next day, Ben gave the marker back, just as good as new. That is how to borrow well. A lost or broken marker would have been borrowing badly.
- S3441-3: Ben was a producer, because he made the bookmarks himself. Each one took paper that cost two dollars and a ribbon that cost one dollar. [slowly, adding] So each bookmark cost three dollars to make.
- S3441-4: [a shop bell] His neighbors were the consumers. They bought the bookmarks and used them in their books.
- S3441-5: Then Sam asked to borrow Ben's new scissors. [thoughtful] Ben thought about it first. Sam had given the marker back on time, [warm] so Ben said yes.

