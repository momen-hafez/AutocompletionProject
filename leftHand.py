
solved = False;
import API
import sys
orient=0
cells = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]

flood=[[14,13,12,11,10,9,8,7,7,8,9,10,11,12,13,14],
        [13,12,11,10,9,8,7,6,6,7,8,9,10,11,12,13],
        [12,11,10,9,8,7,6,5,5,6,7,8,9,10,11,12],
        [11,10,9,8,7,6,5,4,4,5,6,7,8,9,10,11],
        [10,9,8,7,6,5,4,3,3,4,5,6,7,8,9,10],
        [9,8,7,6,5,4,3,2,2,3,4,5,6,7,8,9],
        [8,7,6,5,4,3,2,1,1,2,3,4,5,6,7,8],
        [7,6,5,4,3,2,1,0,0,1,2,3,4,5,6,7],
        [7,6,5,4,3,2,1,0,0,1,2,3,4,5,6,7],
        [8,7,6,5,4,3,2,1,1,2,3,4,5,6,7,8],
        [9,8,7,6,5,4,3,2,2,3,4,5,6,7,8,9],
        [10,9,8,7,6,5,4,3,3,4,5,6,7,8,9,10],
        [11,10,9,8,7,6,5,4,4,5,6,7,8,9,10,11],
        [12,11,10,9,8,7,6,5,5,6,7,8,9,10,11,12],
        [13,12,11,10,9,8,7,6,6,7,8,9,10,11,12,13],
        [14,13,12,11,10,9,8,7,7,8,9,10,11,12,13,14]]
def updateWalls(x,y,orient,L,R,F):
    if(L and R and F):
        if (orient==0): 
            cells[y][x]= 13
        elif (orient==1): 
            cells[y][x]= 12
        elif (orient==2): 
            cells[y][x]= 11
        elif (orient==3): 
            cells[y][x]= 14

    elif (L and R and not F):
        if (orient==0 or orient== 2): 
            cells[y][x]= 9
        elif (orient==1 or orient==3): 
            cells[y][x]= 10

    elif (L and F and not R):
        if (orient==0): 
            cells[y][x]= 8
        elif (orient==1): 
            cells[y][x]= 7
        elif (orient==2): 
            cells[y][x]= 6
        elif (orient==3): 
            cells[y][x]= 5

    elif (R and F and not L):
        if (orient==0): 
            cells[y][x]= 7
        elif (orient==1): 
            cells[y][x]= 6
        elif (orient==2): 
            cells[y][x]= 5
        elif (orient==3): 
            cells[y][x]= 8

    elif(F):
        if (orient==0): 
            cells[y][x]= 2
        elif (orient==1): 
            cells[y][x]= 3
        elif (orient==2): 
            cells[y][x]= 4
        elif (orient==3): 
            cells[y][x]= 1

    elif(L):
        if (orient==0): 
            cells[y][x]= 1
        elif (orient==1): 
            cells[y][x]= 2
        elif (orient==2): 
            cells[y][x]= 3
        elif (orient==3): 
            cells[y][x]= 4

    elif(R):
        if (orient==0): 
            cells[y][x]= 3
        elif (orient==1): 
            cells[y][x]= 4
        elif (orient==2): 
            cells[y][x]= 1
        elif (orient==3): 
            cells[y][x]= 2
# ----- directions ------#
def Left():
    orient = 0
    API.turnLeft()
    orient = API.orientation(orient,'L')
    API.moveForward()

def Right():
    orient = 0    
    API.turnRight()
    orient = API.orientation(orient,'R')
    API.moveForward()

def Streight():
    orient = 0    
    API.moveForward()

def Back():
    orient = 0    
    API.turnLeft()
    orient = API.orientation(orient,'L')
    API.turnLeft()
    orient = API.orientation(orient,'L')
    API.moveForward()

def main():
    x = 0
    y = 0
    orient = 0
    target = 0
    path     = []
    opt_path = []
    while True:
        L= API.wallLeft()
        R= API.wallRight()
        F= API.wallFront()  
        updateWalls(x , y , orient , L , R , F)
        x,y = API.updateCoordinates(x,y,orient)
        if x == 8 and y == 0:
            solved = True;
        if not solved:
            L= API.wallLeft()
            R= API.wallRight()
            F= API.wallFront()  
            if(not L):
                Left()
                path.append("L")
            elif(L and not F):
                Streight()
                path.append("F")
            elif(L and F and not R):
                Right()
                path.append("S")
            else:
                Back()
                path.append("B")
        else:
            for i in range(0 , length(path) - 2):
                if path[i] == "L" and path[i + 1] == "B" and path[i + 2] == "R":
                    opt_path.append("B")
                elif path[i] == "L" and path[i + 1] == "B" and path[i + 2] == "S":
                    opt_path.append("R")
                elif path[i] == "L" and path[i + 1] == "B" and path[i + 2] == "L":
                    opt_path.append("S")
                elif path[i] == "S" and path[i + 1] == "B" and path[i + 2] == "L":
                    opt_path.append("R")
                elif path[i] == "S" and path[i + 1] == "B" and path[i + 2] == "S":
                    opt_path.append("B")
                elif path[i] == "R" and path[i + 1] == "B" and path[i + 2] == "L":
                    opt_path.append("B")  
                i = i + 2
            for i in range(0 , length(opt_path)):
                if opt_path[i] == "L":
                   Left();
                elif opt_path[i] == "R":
                    Right()
                elif opt_path[i] == "S":
                    Streight()
                else:
                    Back()

if __name__ == "__main__":
    main()