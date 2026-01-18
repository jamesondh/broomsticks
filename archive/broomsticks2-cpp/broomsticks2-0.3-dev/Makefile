CC = g++

CFLAGS = `sdl-config --cflags`
LIBS   = `sdl-config --libs`

OBJS = br2.o brGraphics.o FlyingObject.o Person.o Ball.o

br2: $(OBJS)
	$(CC) -o br2 $(OBJS) $(LIBS)

clean:
	rm -f br2 *.o

.SUFFIXES: .cxx .o

.cxx.o:
	$(CC) $(CFLAGS) $(INCS) -c $<
