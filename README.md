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


# run 

/********** run  **************/
1.  python  Castro
2.  open & view   index.html?id=Castro_1 
	or   	    	index.html?id=Castro_2 





