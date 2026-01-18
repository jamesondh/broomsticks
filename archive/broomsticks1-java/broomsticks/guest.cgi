#!/usr/sbin/perl

require "cgi-lib.pl";

$ENV {"LIBWWW_PERL"} = "libwww-perl-0.40";
$ENV {"TZ"} = "CST6CDT";

if (&ReadParse(*input)) {
  $name = $input {"name"};
  $email = $input {"email"};
  $homepageT = $input {"homepageT"};
  $homepageA = $input {"homepageA"};
  $from = $input {"from"};
  $comments = $input {"comments"};

  open(BOOK, ">>guests.html") || die "can't open guestbook file\n";

#  print BOOK "\n<P><hr>\n";
  print BOOK "\n<table border=0 cellpadding=0 cellspacing=0><tr><td bgcolor=#444444><table border=0 cellpadding=10 cellspacing=1 width=600><tr><td bgcolor=#e5e5e5>\n";
  print BOOK "<font face=helvetica size=-1>\n";
  print BOOK "<ul>\n";
  print BOOK "<li>Name: <a href=\"mailto:$email\">$name</a>\n";
  print BOOK "<li>Homepage: <a href=\"$homepageA\" target=\"new\">$homepageT</a>\n";
  print BOOK "<li>From: $from\n";
  print BOOK "<li>Date: ";
  print BOOK `date`;
  print BOOK "<li>Comments: $comments\n";
  print BOOK "</font>\n";
  print BOOK "</ul></td></tr></table></td></tr></table><P>\n";

  close BOOK;

  print &PrintHeader;
  print "<HTML><BODY bgcolor=#aaaacc><center><br><br><br>";
  print "<table border=0 cellpadding=0 cellspacing=0><tr><td bgcolor=#444444><table border=0 cellpadding=10 cellspacing=1 width=400><tr><td bgcolor=#e5e5e5>\n";
  print "<center><font face=helvetica><font size=+2>Thanks!</font><br><br>";
  print "Your information has been recorded.\n";
#  print "<P><a href=\"guests.html\">View guestbook</a>\n";
  print "<P><a href=\"guestbook.html\">Back to top</a>\n"; 
  print "</td></tr></table></td></tr></table>\n";
  print "</center></BODY></HTML>";
}


