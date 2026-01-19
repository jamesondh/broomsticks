export interface HighlightedComment {
  quote: string;
  author: string;
  sourceFile: string;
  anchor: string;
  response?: string;
}

export interface HighlightSection {
  id: string;
  title: string;
  description: string;
  comments: HighlightedComment[];
}

export const HIGHLIGHTED_SECTIONS: HighlightSection[] = [
  {
    id: 'economics',
    title: 'The Economics of Childhood',
    description: '$10 and parental gatekeepers - the fundamental tension of early internet commerce.',
    comments: [
      {
        quote: "I really like your Broomsticks game. I want the full version but my parents won't let me have 10 bucks.",
        author: 'Jerry Corne',
        sourceFile: 'guests-04.html',
        anchor: 'aug20-jerrycorne-49',
      },
      {
        quote: "Great game! I tried 2000 gold balls, and it's InSaNe! I want to order it, but I spent all my money on... wait a minute, I never had any money in the first place -_-",
        author: 'Matt Hicks',
        sourceFile: 'guests-dec01.html',
        anchor: 'dec1-matthicks-2',
      },
      {
        quote: "Whoa! Ten bucks American! You've gotta be kidding! My mom and dad wont let me have that! Lower the price! You'll get more money that way!",
        author: 'Android4 (Canada)',
        sourceFile: 'guests-oct.html',
        anchor: 'oct8-android4-38',
      },
      {
        quote: "YES!!!!!!!!!!!!!!!! My parents finally said that we can get the full version!!!! I can't wait for it to get here! I had to do a lot of chores to get it but YES!!!!!!!!!",
        author: 'Mike',
        sourceFile: 'guests-aug.html',
        anchor: 'aug18-mike-21',
      },
      {
        quote: "I Love your game it is soooooooooooooooo fun I hope this still here when I get enough money I really want to buy it!!",
        author: 'Hannah',
        sourceFile: 'guests-jan02.html',
        anchor: 'jan16-hannah-16',
      },
      {
        quote: "Your game is wicked but Mum won't let us buy it so I guess we will have to visit your site again...and again...and again...and again",
        author: 'Lord Voldemort',
        sourceFile: 'guests-jan.html',
        anchor: 'jan11-lordvoldem-19',
      },
    ],
  },
  {
    id: 'currency',
    title: 'International Currency Confusion',
    description: 'The pre-PayPal struggle - international payment was a nightmare for children.',
    comments: [
      {
        quote: "I think Broomsticks (3D) is pretty cool. It's just that I live in Australia, so that I can't really afford the full version... Because I live in Oz, the value of the Aussie dollar is about half as much as the US (boo) dollar which works out me paying TWICE AS MUCH as the 'USians.'",
        author: 'Jeremy (Australia)',
        sourceFile: 'guests-may02.html',
        anchor: 'may9-jeremy-12',
      },
      {
        quote: "Sad you cant add networking. I have a friend here that rarely meets me, and then we often play Broomsticks Advanced. But we are sad because we cant do networking... I cant buy the Full Version, sorry. I do not have American money and besides, If I had I wouldnt be able to because I'm not allowed to.",
        author: 'Siddharth',
        sourceFile: 'guests-may02.html',
        anchor: 'may29-siddharth-41',
      },
      {
        quote: "I like your game and wouldn't mind getting it although I live in england (sob!) Is there ne way to get it to me?",
        author: 'Shaun (UK)',
        sourceFile: 'guests-sep.html',
        anchor: 'sep9-shaun-8',
        response: "Sure, you can get it! I've had a good number of orders from England.",
      },
      {
        quote: 'Paul would u send to Canada? Because i see alot of other countries on there. Just making sure.',
        author: 'Devin (Canada)',
        sourceFile: 'guests-aug02.html',
        anchor: 'aug16-devin-40',
        response: 'Of course! I get more orders from Canada than from any other country except the United States.',
      },
    ],
  },
  {
    id: 'sept11',
    title: 'September 11, 2001',
    description: 'History intersecting with a kids\' game - world events directly impacted game distribution.',
    comments: [
      {
        quote: "Hey! I sent in money for broomsticks 2.5 weeks ago, should i get it soon? I know you were out of town, and those idiots screwed up New York (which may have delayed air mail) but still it's taking to long!!!!",
        author: 'No Name (September 2001)',
        sourceFile: 'guests-sep.html',
        anchor: 'sep18-no-12',
        response: "Ok, I got your email and checked my records. I sent the game on Monday, Sept. 10. The crisis in New York and the grounding of airplanes may have slowed mail.",
      },
      {
        quote: "Sorry I've been gone so long. You don't need to make me a patch, it's PERFECT as it is. By the way, is there any chance we'll see a Broomsticks Tournament? With prizes & everything? It might get us Broomsticks players even closer. (Closer? after the attacks?) Think about a Broomsticks Olympics, okay? P.S. May we always and forever stand as the United States of America!",
        author: 'Aaron (September 20, 2001)',
        sourceFile: 'guests-sep.html',
        anchor: 'sep20-aaron-14',
      },
      {
        quote: "Has anyone else here got an e-mail or something about Nostradamus 'Prophesying' about the WTC attacks? Don't believe it, it's a hoax, just one BIG mix and match thingy. P.S. God bless the U.S.A!",
        author: 'Aaron',
        sourceFile: 'guests-sep.html',
        anchor: 'sep21-aaron-16',
      },
    ],
  },
  {
    id: 'schools',
    title: 'Schools & Libraries',
    description: 'Where Broomsticks spread virally - the game became a social phenomenon in computer labs.',
    comments: [
      {
        quote: "BEST GAME EVER! At school we get a time for 2 people to go on a computer and whenever that time comes me and my friends go we would switch back and forth! I even remember the day when we had 4 players! We did a 2v2 it was insane!",
        author: 'Tyler',
        sourceFile: 'guests-dec01.html',
        anchor: 'dec15-tyler-31',
      },
      {
        quote: "This is the best game ever and probably the only decent quidditch game out there. Me and my brother love this game and are forced to come up with excuses of why we dont have our homework because instead of doing it we are playing this game!",
        author: 'Anonymous',
        sourceFile: 'guests-oct01.html',
        anchor: 'oct24-anon-18',
      },
      {
        quote: "This game is way cool!! I play it any chance i get (even at school sometimes when were not supposed to!)",
        author: 'Cho Chang',
        sourceFile: 'guests-oct.html',
        anchor: 'oct5-chochang-19',
      },
      {
        quote: "Thanks to your 'Broomstick' game I have something to look forward to when I come home from school every day!!!! I've recommended your game to about 30 friends of mine!!! They all love the game!!!",
        author: 'Nick Spadino',
        sourceFile: 'guests-apr.html',
        anchor: 'apr18-nickspadin-48',
      },
      {
        quote: "I have recived info from a survey that in my school 35 people will buy your game. (which is very good, may I add) Thats $350!",
        author: 'JP and His Friends',
        sourceFile: 'guests-mar.html',
        anchor: 'mar12-jpandhisfr-51',
      },
      {
        quote: "Hey Paul, your site really rocks. I love it 100%... I would like to ask on behalf of all my 40 friends (who play this game at school) to put the full version online just for a bit of time.",
        author: 'Ian Hyrule',
        sourceFile: 'guests-nov01.html',
        anchor: 'nov20-ianhyrule-30',
        response: 'Maybe you and your friends should pool your money together and get a 4 pack! :-)',
      },
      {
        quote: "Your game is amazing. My friends and I found it a few weeks ago during downtime during computer science class, and have been hooked on it ever since.",
        author: 'Lee',
        sourceFile: 'guests-dec02.html',
        anchor: 'dec23-lee-32',
      },
    ],
  },
  {
    id: 'sleepovers',
    title: 'Siblings, Sleepovers, Social Gaming',
    description: 'Before online multiplayer, Broomsticks brought people together physically.',
    comments: [
      {
        quote: "This is the best game we ever played! last night 20 of my friends came over and we played this game all night until 9:00AM that is how much we love it! especially the 3D game, keep working Paul cause your going to have some followers..lol",
        author: 'Tom Riddle',
        sourceFile: 'guests-aug03.html',
        anchor: 'aug28-tomriddle-22',
        response: 'Thanks Tom! Comments like this make me glad that I made the game. :-)',
      },
      {
        quote: "This is the best site. I had a sleepover at my cousins, and we played this game forever.",
        author: 'Harry Potter',
        sourceFile: 'guests-nov01.html',
        anchor: 'nov8-harrypotte-14',
      },
      {
        quote: "I really, really like this game, my sister and I were playing the advanced demo version, and were having so much fun (taking sibling rivalry to new heights)",
        author: 'Fauna',
        sourceFile: 'guests-jan03.html',
        anchor: 'jan7-fauna-2',
        response: 'Thanks Fauna! I made some of my first games specifically for playing against (and beating!) my brothers.',
      },
      {
        quote: "Me and my little brother love playing your game. It's Awesome!!!!!!!!!",
        author: 'Jessica Quinn',
        sourceFile: 'guests-dec01.html',
        anchor: 'dec18-jessicaqui-37',
      },
      {
        quote: "Although I am 18, I am an avid reader of Harry Potter and Am taking my brothers to see the movie on the 16 of Nov. when it comes out here in the states. Anyway, I can't wait to see the look on my brothers faces when they see the game, they will be in heaven, keep up the good work. P.S. I think I know what I am getting my brothers for Christmas!",
        author: 'Jeremy',
        sourceFile: 'guests-nov01.html',
        anchor: 'nov6-jeremy-10',
      },
    ],
  },
  {
    id: 'emotional',
    title: 'Emotional Testimonials',
    description: 'A game that mattered - sometimes a simple game meant more than entertainment.',
    comments: [
      {
        quote: "hi paul its me sol i just got the game i found it at gramdmas house i totally forgot about the game since mom had a horrible car accident i didn't think about it but wow the game is a total relief for me and mom.....my little brothers cant stop playing lol [and so do i] thanks alot for the opportunities and Broomsticks ROCKS!",
        author: 'Sol (Puerto Rico)',
        sourceFile: 'guests-jul02.html',
        anchor: 'jul25-sol-30',
        response: "Sol, I'm glad you and your brothers are enjoying the full version. I hope your mom is ok.",
      },
      {
        quote: "I love this game!!!! I play it every day. It's just like I'm a real wizard flying on a broom.",
        author: 'Padfoot',
        sourceFile: 'guests-dec.html',
        anchor: 'dec2-padfoot-10',
      },
      {
        quote: "REALY PLAYING QUIDDITCH! WHEN I WAS A YOUNG MUGGLE CHILD (AS I OFTEN WAS) I USED TO DREAM OF PLAYING QUIDDITCH. NOW I REALLY CAN! WHOEVER CREATED THIS WEBSITE IS MY HERO! THATS WHAT I WANT TO DO WHEN I GROW UP! I THINK THAT IT WOULD BE SO FUN DESIGNING WEBSITES ABOUT QUIDDITCH FOR MUGGLES ACROSS AMERICA! THANK YOU. THANK YOU FOR ENCOURAGING ME!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
        author: 'Wyat',
        sourceFile: 'guests-nov.html',
        anchor: 'nov27-wyat-95',
      },
      {
        quote: "As soon as i started playing i couldnt get off. Mums getting really angry with me cause i spend so much time here.",
        author: 'Nadine Castillo',
        sourceFile: 'guests-jan.html',
        anchor: 'jan11-nadinecast-22',
      },
      {
        quote: "I want to start learning to program and I was wondering if you could point me in the right direction. Things like, what books to read, sites to visit, programs to purchase and download, etc. I am really serious about this matter and you inspired me to try harder and do something about my future dream. Please reply.",
        author: 'Dustin Gabriel',
        sourceFile: 'guests-jan.html',
        anchor: 'jan22-dustingabr-67',
      },
    ],
  },
  {
    id: 'programmers',
    title: 'The Young Programmers',
    description: "Learning inspired by Broomsticks - Paul's game inspired a generation of future developers.",
    comments: [
      {
        quote: 'How did you make the game? E-mail me the answer! By the way YOUR GAME ROCKS PAUL!!! ROCK ON!!!',
        author: 'Charlie',
        sourceFile: 'guests-jun.html',
        anchor: 'jun3-charlie-6',
        response: 'I wrote the game from scratch using the Java programming language: http://java.sun.com/docs/books/tutorial/',
      },
      {
        quote: "Thanks alot again, Paul. I have mastered Basic but JavaScript is a bit too complex and time consuming for me at the moment (I can only use the PC 30 min a day) so I have decided to take up flash first.",
        author: 'Dustin Gabriel',
        sourceFile: 'guests-may.html',
        anchor: 'may2-dustingabr-0',
        response: 'Good to see that you are programming! You are welcome.',
      },
      {
        quote: "What a superb game! I was almost jumping with excitement when I was playing. I am in Class 5 now and I am going to learn Java very soon (you can laugh but it's true!)",
        author: 'Chiradeep R.',
        sourceFile: 'guests-may.html',
        anchor: 'may25-chiradeepr-50',
        response: 'Thanks! Good luck with the programming and have fun!',
      },
      {
        quote: "Hi Paul, it's me, you've probably forgotten who I am though. I have finally learnt to program in Visual Basic 5.0 Professional edition, and have made a few programs and one game.",
        author: 'Brad17',
        sourceFile: 'guests-jan.html',
        anchor: 'jan21-brad17-62',
        response: 'Excellent! Glad to hear that you have taken up programming, stick with it!',
      },
      {
        quote: 'Can you please sign my guestbook. I bought the visual basics book. It has a lot of information in it about game programming. You are the right person to help make games for my site. Please just try. Thanx.',
        author: 'Xavier Jones',
        sourceFile: 'guests-jan.html',
        anchor: 'jan23-xavierjone-76',
      },
    ],
  },
  {
    id: 'cave',
    title: 'The CAVE Connection',
    description: "When kids discovered Paul's day job with million-dollar supercomputers at NCSA.",
    comments: [
      {
        quote: "Love the game! Ever think of modeling the quidditch pitch in CAVE? That would be incredible! Especially if you could make it so you could fly on a broomstick around the pitch!",
        author: 'Josh',
        sourceFile: 'guests-dec01.html',
        anchor: 'dec7-josh-15',
        response: 'Thanks! I have thought of that. Actually, I can run my Broomsticks 3D in the CAVE!',
      },
      {
        quote: "Paul, you haven't sent me an email yet. Anyway, do you know C/C++? Obviously you know JAVA but I was wondering if you knew C/C++, as I wanted to know what language you use to code the CAVE.",
        author: 'Brad17',
        sourceFile: 'guests-jul.html',
        anchor: 'jul4-brad17-13',
        response: 'For CAVE programs, I use the SGI compiler since the CAVE runs off of a million dollar SGI system.',
      },
      {
        quote: "your game is basic, a little complex, but still pretty insignificant compared to other games your price!... those screen shots are fake, theres no broomsticks 3-d. thats just some other game your developing at cave.",
        author: 'Nameless',
        sourceFile: 'guests-jul.html',
        anchor: 'jul26-nameless-62',
        response: 'Broomsticks 3D uses the same engine as one of my CAVE projects, but it is a separate game that runs on regular [computers]',
      },
    ],
  },
  {
    id: 'copyright',
    title: 'The Copyright Question',
    description: "Dodging Warner Bros. - players and observers noticed Paul's clever legal maneuvering.",
    comments: [
      {
        quote: "I'm impressed about how you avoided the copyrights by not using any names... I wouldn't have thought of that.",
        author: 'Matt Hicks',
        sourceFile: 'guests-dec01.html',
        anchor: 'dec1-matthicks-2',
      },
      {
        quote: "It seems you were wise not to use such words as 'snitch', 'bludger', 'quidditch', or even 'Harry Potter'. Apparently some of the other (less bright) programmers are encountering legal complications.",
        author: 'RK Jowling',
        sourceFile: 'guests-dec.html',
        anchor: 'dec29-rkjowling-95',
      },
      {
        quote: 'Can we call the balls by their real names when talking about them in this guestbook or will that violate some copyright thing?',
        author: 'Daniel',
        sourceFile: 'guests-oct02.html',
        anchor: 'oct10-daniel-16',
      },
      {
        quote: "Sorry for signing this so much, but I have another question. I was thinking about what that jerk 'HELLO' said, and can J.K. sue you? I know you say 'Red ball' and 'Black ball' and 'tiny fast gold ball'. but can she sue you anyways?",
        author: 'Steve',
        sourceFile: 'guests-apr03.html',
        anchor: 'apr21-steve-31',
        response: 'Really, the most important thing to J.K. and Warner Brothers are the names.',
      },
      {
        quote: "No J.K. Rowling or Warner Bros. cannot sue Paul because his game is called 'Broomsticks' not 'Quidditch' which is a copyrighted name. He also refers to them as 'red/black/gold ball' as you said above.",
        author: 'Daniel',
        sourceFile: 'guests-apr03.html',
        anchor: 'apr21-daniel-33',
      },
      {
        quote: 'You might get into serious trouble for using the quidditch game for commercial purposes without having an official license from warner bros...',
        author: 'Albus D.',
        sourceFile: 'guests-feb.html',
        anchor: 'feb2-albusd-3',
      },
    ],
  },
  {
    id: 'toxicity',
    title: 'Early Internet Toxicity',
    description: 'Community defense - the guestbook shows early patterns of online harassment and response.',
    comments: [
      {
        quote: 'I have better games than this on my site, they are free as well. And have tournaments, etc. Go to www.mysterymonkey.1fx.net',
        author: 'Harry',
        sourceFile: 'guests-dec.html',
        anchor: 'dec2-harry-4',
      },
      {
        quote: 'WWW.MYSTERYMONKEY.1FX.NET HAS WAAAAAYYYYY BETTER GAMES!!!! FOR FREE!!!! WITH TOURNAMENTS!!!! AND TRAINING!!!! AND WEATHER CONDITIONS!!!! AND DECENT GRAPHICS!!!! AND THERE ARE OVER 15 DIFFERENT ONES!!!',
        author: 'Johnny',
        sourceFile: 'guests-dec.html',
        anchor: 'dec2-johnny-7',
      },
      {
        quote: "I went on that monkey kids games. It's keyboarding and there's no graphics. Your game is definitely better and thanks for info on making games.",
        author: 'Robin',
        sourceFile: 'guests-dec.html',
        anchor: 'dec11-robin-37',
      },
      {
        quote: "This is a great site. mysterymonkey games dont always work and you have to download them. your site is easy and quick to start up because it is online... the games never work on mine and my friends computer so I dont go any more.",
        author: 'Shane',
        sourceFile: 'guests-dec.html',
        anchor: 'dec15-shane-50',
      },
      {
        quote: "Your game is a lot better than that stupid Mysterymonkey's or whatever his name is.",
        author: 'Mudboy Jimmy',
        sourceFile: 'guests-dec.html',
        anchor: 'dec18-mudboyjimm-63',
      },
      {
        quote: "Everyone who signed this guestbook and read 'mysterymonkey's comments, should have received an email that said that the mysterymonkey person was ACTUALLY an imposter, and that mysterymonkey has no bad feelings toward Paul's work (In fact, they like it!)",
        author: 'Sara',
        sourceFile: 'guests-jan.html',
        anchor: 'jan16-sara-38',
      },
      {
        quote: "I think it's VERY rude to post rude comments on guestbooks. Anyone who does is VERY rude. Paul Rajlich went to all the LOTS OF EFFORT of making these games and people say stuff like 'MONKEY ? IS WAY BETTER THAN BROOMSTICKS'!",
        author: 'Jeremy',
        sourceFile: 'guests-jun02.html',
        anchor: 'jun2-jeremy-0',
        response: 'Thanks for the info Jeremy.',
      },
      {
        quote: "THIS GAME SUCKS THE CHARECTERS CAN'T MOVE AND THERE IS NO WAY I AM PLAYING AGAIN I HATE IT THE DOWN ARROW DOESENT WORK AND THEY KEEP MOVING WHEN I LET GO OF THE ARROWS AND THE BLUDGERS DON'T EFFECT COMPUTER PLAYERS AND JK ROWLING SHOULD SUE YOU AND SO THERE!",
        author: 'Hello',
        sourceFile: 'guests-apr03.html',
        anchor: 'apr21-hello-27',
      },
      {
        quote: "This guestbook is out of control, Paul needs to get someone with a little more time on their hands to at least delete the stupid posts.",
        author: 'Larrin',
        sourceFile: 'guests-jun03.html',
        anchor: 'jun11-larrin-40',
        response: "I can delete the stupid posts, but then posts like yours (which are about the stupid posts) will not make sense.",
      },
    ],
  },
  {
    id: 'better-than-official',
    title: 'Better Than the Official Games',
    description: 'Players consistently compared Broomsticks favorably to official Harry Potter games.',
    comments: [
      {
        quote: 'better than the h.p. quidditch game at www.harrypotter.com! which look like a playstation game....its sucks, this one is way better!',
        author: 'MLtheD',
        sourceFile: 'guests-aug.html',
        anchor: 'aug4-mlthed-3',
        response: "Thanks! That's what I want to hear. :-)",
      },
      {
        quote: "Broomsticks is fun. It is like no other 'Quidditch' game I have played. In most other games you can't even hold the 'Quaffle', it just bounces off your character. In other games, the 'Bludgers' don't hit you at all, and the 'Snitch' could fly around for HOURS before it EVER gets caught. Broomsticks, however, is perfect.",
        author: 'Aaron',
        sourceFile: 'guests-jul.html',
        anchor: 'jul18-aaron-49',
      },
      {
        quote: "I got Harry Potter #2 for PC, and the Quidditch was terrible. It was so stupid, you AUTOMATICALLY follow the Golden Snitch. Your B3D is Much better.",
        author: 'Daniel',
        sourceFile: 'guests-nov02.html',
        anchor: 'nov29-daniel-62',
      },
    ],
  },
  {
    id: 'enthusiasm',
    title: 'Pure Enthusiasm',
    description: 'Kids being kids - raw, unfiltered enthusiasm.',
    comments: [
      {
        quote: "THIS IS THE VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY VERY BEST GAME I,VE PLAYED EVER I WISH I WAS ALOUD TO BY IT.",
        author: 'James',
        sourceFile: 'guests-apr.html',
        anchor: 'apr20-james-52',
      },
      {
        quote: 'AWSOME SITE!!!!!!!!! Our mom cant get us off the game. We are getting the full version soon',
        author: 'Caylen and Sam',
        sourceFile: 'guests-aug.html',
        anchor: 'aug16-caylenands-17',
      },
      {
        quote: 'I LOVE THIS GAME!!!!!!!!!!!! I LOVE THIS SITE!!!!!!!!!! I LOVE U!!!!!!!!',
        author: 'Alyssa',
        sourceFile: 'guests-feb.html',
        anchor: 'feb20-alyssa-71',
      },
      {
        quote: "I love this game I wish you had the golden snitch and more players but I guess that's what the full version is for.",
        author: 'Marty',
        sourceFile: 'guests-jul.html',
        anchor: 'jul26-marty-60',
      },
      {
        quote: 'Awsome game!! I play it for hours every day!!! I am addicted to it!!!!!!Rock on!!!!!!!!',
        author: 'Andrew',
        sourceFile: 'guests-apr.html',
        anchor: 'apr29-andrew-69',
      },
    ],
  },
  {
    id: 'about-paul',
    title: 'About Paul',
    description: 'Glimpses of the creator - Paul occasionally shared personal details in his responses.',
    comments: [
      {
        quote: 'How old are you?',
        author: 'User',
        sourceFile: 'guests-feb.html',
        anchor: 'feb-paul-age',
        response: "I'm 26 years old, but I don't always act my age. :-) My favorite sport is is probably basketball. I also like to lift weights.",
      },
      {
        quote: 'Where are you from?',
        author: 'User',
        sourceFile: 'guests-dec.html',
        anchor: 'dec-paul-origin',
        response: '[Czech Republic]. I moved to the USA when I was 6 years old.',
      },
      {
        quote: '[About Lasertron]',
        author: 'Paul',
        sourceFile: 'guests-oct.html',
        anchor: 'oct-lasertron',
        response: 'Lasertron is based on a game that I wrote when I was about 12 years old! :-)',
      },
      {
        quote: '[On programming]',
        author: 'Paul',
        sourceFile: 'guests-jan.html',
        anchor: 'jan-programming',
        response: 'I have been programming for a long [time]. I wrote the game from scratch using the Java programming language. Programming is not easy to learn, but once you do you can make all kinds of cool things.',
      },
    ],
  },
  {
    id: 'mini-cd',
    title: 'The Mini CD',
    description: 'A pocket-sized wonder - the physical distribution method fascinated young users.',
    comments: [
      {
        quote: "I really like this game! It is soooo cool! My other friends & I played the demo. We love it! Were CONSIDERING into buying the cd. Oh and, is it REALLY the size of a credit card??",
        author: 'MT',
        sourceFile: 'guests-jan.html',
        anchor: 'jan12-mt-23',
      },
      {
        quote: "I think its much better to have a cd so you can take to a friend's house and still play it!",
        author: 'Sara',
        sourceFile: 'guests-dec.html',
        anchor: 'dec17-sara-57',
      },
      {
        quote: "Hey Pual this is Daniel, I sent you an e-mail a few days ago. I got the Broomsticks game today it is really cool!!! Thanks",
        author: 'Daniel',
        sourceFile: 'guests-sep.html',
        anchor: 'sep21-daniel-17',
        response: "I'm glad you finally got the game. Mail must have really been slowed down by the WTC attack.",
      },
    ],
  },
  {
    id: 'characters',
    title: 'Memorable Characters & Locations',
    description: 'Creative and fictional locations listed by users.',
    comments: [
      {
        quote: "Just to let you know, my name really is Harry Potter. Anyway, this is the best Quidditch game I've played on the net so far.",
        author: 'Harry Potter',
        sourceFile: 'guests-apr.html',
        anchor: 'apr11-harrypotte-28',
      },
      {
        quote: 'MY NAME IS REALLY HARRY POTTER. BROOMSTICKS RULES',
        author: 'Harry Potter',
        sourceFile: 'guests-jun.html',
        anchor: 'jun3-harrypotte-8',
        response: 'Nice name! :-)',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Era',
    description: '56k modems and old computers - constraints of the early web.',
    comments: [
      {
        quote: "Can I download it to my hard disk and learn - I'm really glad that it doesn't require Flash or a Java plugin as such - my computer is old and slow (clone, 1997), and I've only been on the Internet since April last year (2000).",
        author: 'Adelaide Lane',
        sourceFile: 'guests-mar.html',
        anchor: 'mar2-adelaidela-5',
      },
      {
        quote: "[On networking]",
        author: 'Paul',
        sourceFile: 'guests-may02.html',
        anchor: 'may-networking',
        response: "I tried [networking] a while back but wasn't too happy with it. It didn't work too well over a modem connection.",
      },
    ],
  },
];
