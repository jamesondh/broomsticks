import java.lang.*;
import java.util.*;
import java.awt.*;
import java.awt.image.*;
import java.applet.*;
import java.io.*;

public class TestApplet extends Applet {

  public void init() {
    try {
      DataOutputStream os = new DataOutputStream(new FileOutputStream("out.txt"));
      os.writeBytes("this is a test\n");
      os.close();
    } catch (IOException e) {
    }
  } 
}
