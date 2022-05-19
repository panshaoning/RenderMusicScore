from music21 import converter,instrument, note, chord
from midi2audio import FluidSynth
import os
import sys 


def test(filename):
    path = './files/'
    #filename = 'hongdou'
    print(f'star convert ./mid/{filename}.mid to xml && krn')
    s = converter.parse(f'./mid/{filename}.mid')
    parts = instrument.partitionByInstrument(s)
    #makeFiles(parts,path,filename);

    j = 1 
    for part in parts:
        print('part',part)
        xml = f'{filename}_{j}'
        iNotes = part.notesAndRests.stream()
        makeFiles(iNotes,path,xml);
        j=j+1


    #s.write('musicxml','hai.xml')
    #s.write('lily.png','1')

    #s.write('xml','111.xml')
    #conv =  converter.subConverters.ConverterLilypond()
    #conv.write(s, fmt = 'lilypond', fp='2', subformats = ['png'])
    #s.show('musicxml.png')

#make krn file
def makeFiles(stream,path,filename):
    stream.write('musicxml',f'{path}{filename}.xml')
    os.system(f'xml2hum  {path}{filename}.xml  > {path}{filename}.krn')
    #os.system(f'mid2hum  ./mid/{filename}.mid  > {path}{filename}.krn')
    stream.write('midi',f'{path}{filename}.mid')
    convertmp3(path,filename)



def convertmp3(path,filename):
    fs = FluidSynth(sound_font='UprightPianoKW-20220221.sf2',sample_rate=22050)
    fs.midi_to_audio(f'{path}{filename}.mid', f'{path}{filename}.wav')
    os.system(f'rm -f {path}{filename}.mp3')
    os.system(f"ffmpeg -i {path}{filename}.wav   {path}{filename}.mp3")
    os.system(f'rm -f {path}{filename}.wav')


def pan():
    #c = converter.parse('tinynotation: 3/8 C8 D E F G A B4.')
    #c.measure(1).rightBarline = 'light-light'
    #c.measure(3).rightBarline = 'light-heavy'
    c = converter.parse('tinynotation: 3/4 c4 d8 f g16 a g f#')
    c.write('musicxml','3.xml')
    c.write('lily.png','3')


def print_r(obj):
    print('\n'.join(['%s:%s' % item for item in obj.__dict__.items()]))

if __name__ == '__main__':
    args = sys.argv
    print(args)
    if len(args) < 2:
        print('need mid file name')
    else:
        test(args[1])

