#!/usr/sbin/perl

require "cgi-lib.pl";

$ENV {"LIBWWW_PERL"} = "libwww-perl-0.40";
$ENV {"TZ"} = "CST6CDT";

if (&ReadParse(*input)) {
  $order = $input {"order"};
  $name = $input {"name"};
  $email = $input {"email"};
  $address = $input {"address"};
  $td = "<td bgcolor=#e5e5e5><font face=helvetica size=-1>";

  open(BOOK, ">>orders.html") || die "can't open orders file\n";

#  print BOOK "\n<table border=0 cellpadding=0 cellspacing=0><tr><td bgcolor=#444444><table border=0 cellpadding=10 cellspacing=1 width=600>\n";
  print BOOK "<tr>\n";
  print BOOK "$td ";
  print BOOK `date +\"%a %b %e %T\"`;
  print BOOK "</td>\n";
  print BOOK "$td $order</td>\n";
  print BOOK "$td $name</td>\n";
  print BOOK "$td <a href=\"mailto:$email\">$email</a></td>\n";
  print BOOK "$td $address</td>\n";
  print BOOK "</tr>\n";
#  print BOOK "</tr></table></td></tr></table>\n";

  close BOOK;

  print &PrintHeader;
  print "<HTML><BODY bgcolor=#aaaacc><center><br><br><br>";
  print "<table border=0 cellpadding=0 cellspacing=0><tr><td bgcolor=#444444><table border=0 cellpadding=10 cellspacing=1 width=400><tr><td bgcolor=#e5e5e5>\n";
  print "<center><font face=helvetica><font size=+2>Thanks!</font><br><br>";
  print "Your information has been recorded.\n";
  print "<P><a href=\"orders.html\">View</a>\n";
  print "</td></tr></table><P></td></tr></table>\n";
  print "</center></BODY></HTML>";
}


