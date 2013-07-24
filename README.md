![](https://secure.gravatar.com/avatar/a52f0b5df73d445c85ffcbb6ac4b1d8b?s=50) Gitwar
======

A platform for git-based turn-based command-line games.

Gitwar and each of its games are written in BASH. That's right.
Git, shell scripting, and playing games has never been so awesome.

## Games

1. [Gitfight](http://github.com/gitwar/gitfight)
2. [Gitchess](http://github.com/gitwar/gitchess)
3. Gitcastle - Coming Soon

## How to play

1. Fork the repo of the game you want to play and add your opponent as a collaborator\*
2. Create a branch for your game and make sure your opponent knows which branch to pull from
3. Tweak `gitwar.users` if necessary (depends on the game)
4. Run `./setup && ./gitwar -c` to download gitwar and setup your game
5. Run the executable of your game and start playing

\* If you don't have anyone to play with. Submit an [issue](https://github.com/gitwar/gitwar/issues)
saying something like, "I need a partner to play Gitchess" or "Who wants to get their butt kicked at
Gitfight?", and wait for someone to reply.

## Writing games

The gitwar script is actually very dumb about
what's going on in the game. It just adds files, commits, pushes,
pulls, and spits out a log. Normal git stuff. The game script can be pretty much anything you want.

Here's the best way to use gitwar when commiting an action:

```bash
getPlayerMove
executeMove
../gitwar "$human_readable_commit_message" "$machine_readable_action"
```

Reading the log:

```bash
log=`../gitwar -l`
# loop over the log to recreate
while read line; do
  action=`echo "$log" | cut -d, -f3`
  # recreate all past actions
done < <(echo "$log")
```

I also suggest having a file for each users' name and
properties. See `gitwar.users` in either gitfight or gitchess.

Make sure you send a pull request with your new game when you're done so everyone can enjoy it.

## Note

This is more for fun than for anything else. It's just yet another way
of showing how cool git and Github are.

Have fun!

------
http://tybenz.com

[Gitwar logo](http://thenounproject.com/noun/soldier/#icon-No1697) designed
by [Simon Child](http://thenounproject.com/Simon Child) from the [Noun
Project](http://thenounproject.com) and [Jason
Long](http://twitter.com/jasonlong) from
[git-scm.com](http://git-scm.com/downloads/logos).
