# RenderMusicScore

1. 渲染乐谱 & 跟随音乐 高亮乐符
2. 拆分midi channel，针对每个channel生成 musicXML &&  krn 
3. midi conver to mp3



# install 

/********** install **************/

pip install music21
pip install midi2audio


yum install fluidsynth


install humd tools :

https://github.com/craigsapp/humextra
https://github.com/humdrum-tools/humdrum-tools


after build ,you need add to PATH.


such as :

vim /etc/profile

add 

export PATH=/usr/local/humdrum-tools-master/humdrum/bin:$PATH
export PATH=/usr/local/humextra-master/bin:$PATH


also need ffmpeg .

# run 
1.   python makefile.py Castro
2.   open & view  such as 
3.   
   
   index.html?id=Castro_1 
   index.html?id=Castro_2 



# 注意事项
1.   extras.humdrum.org 提供了很多工具用来转换数据。比如 mid2hum，可以将 midi 文件转换为 .krn ，xml2hum 也可以直接将musicXML 转换为 .krn   。但是 往往 midi文件中每个channel的节拍和时间是不同的，所以 mid2hum，xml2hum 往往会失败。
2.   在本案例中，使用music21 将 midi 各个channel 拆分开了，再单独生成 musicXML 和 krn 。
3.   假设你需要将 data1.krn  和 data2.krn  结合为一个 krn，那么可以使用humdrum-tools-master/humdrum 提供的 assemble 命令。 但是这个命令也往往会失败。因为往往两个krn文件的节拍时长是不同的。那怎么办呢？ 可以使用humdrum-tools 的 rcheck 命令 来分析两个文件。 data1.krn 数据如下：

	**kern
    *clefG2
    *M4/4
    1FF
    4r
    3%2FF
    1r
    4bb-X 4dd
    2aa 2cc
    3r
    
rcheck  data1.krn  结果如下。 重要的是 dur 列的数据，代表了

   absbeat	dur	bar	beat	::	data
   :::::::::::::::::::::::::::::::::::
   0	0	0	0	::	**kern
   0	0	0	0	::	*clefG2
   0	0	0	0	::	*M4/4
   0	4	0	0	::	1FF
   4	1	0	4	::	4r
   5	2.66667	0	5	::	3%2FF
   7.66667	4	0	7.66667	::	1r
   11.6667	1	0	11.6667	::	4bb-X 4dd
   12.6667	2	0	12.6667	::	2aa 2cc
   14.6667	1.33333	0	14.6667	::	3r

假设data2.kr2 数据如下
   **kern
   *clefG2
   *M4/4
   1FF
   4c
   2r
   3r
那么data1 如何 与data2 结合呢？如下。 其中，4%6r 代表什么意思呢？ 4是4/4拍中，1个节拍时间，4%6r 代表 休息6个节拍的时间。 那这里为什么要是休息6个呢？因为data1 中 前3行的总节拍时长是 4(1FF) + 1（4r）+ 1(4FF) = 6.   顺便再补充下，4代表1个节拍，1代表4个，8代表0.5个，16代表0.25个。

   !!!data1  !!!data2
   **kern	**kern
   *clefG2	*clefG2
   *M4/4	*M4/4
   1FF	4%6r
   4r	.
   4FF	.
   1r	1FF
   4bb-X 4dd	4c
   2aa 2cc	2r
   3r	3r
