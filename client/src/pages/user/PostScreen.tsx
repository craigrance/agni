import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Menu from '../../components/Menu';
import Paper from '@material-ui/core/Paper';
import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import makeCanvas from '../../utilities/makeCanvas';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { Auth } from 'aws-amplify';
import { UserContext } from '../../contexts/UserContext';
import {
  Theme,
  createStyles,
  makeStyles,
  useTheme
} from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: `calc(100vh - 112px)`
    },
    paper: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '48%',
      minWidth: 276,
      maxWidth: 360,
      height: '48%',
      minHeight: 204,
      maxHeight: 360,
      padding: theme.spacing(3, 2)
    },
    input: {
      display: 'none'
    },
    button: {
      width: '88%',
      minWidth: 240,
      margin: theme.spacing(1)
    }
  })
);

const PostScreen = () => {
  const classes = useStyles();

  const inputRef = useRef<HTMLInputElement>(null);

  const history = useHistory();

  const { user, dispatch } = useContext(UserContext);

  const [objectURLForPC, setObjectURLForPC] = useState('');
  const [objectURLForMobile, setObjectURLForMobile] = useState('');
  const [objectURLForThumbnail, setObjectURLForThumbnail] = useState('');

  const appropriateImageWidthForPC = 1980;
  const appropriateImageWidthForMobile = 744;
  const appropriateImageWidthForThumbnail = 312;

  const styleElementTextContent = useMemo(() => {
    const styleElement = document.getElementById('style');
    if (styleElement) {
      return styleElement.textContent;
    }
  }, []);

  const isXsSize = useMediaQuery(useTheme().breakpoints.down('xs'));
  const deviceType = isXsSize ? 'mobile' : 'pc';

  useEffect(() => {
    if (!objectURLForPC || !objectURLForMobile) {
      return;
    }
    const styleElement = document.getElementById('style');
    if (styleElement && deviceType === 'pc') {
      styleElement.textContent = `
      body:before {
        content: '';
        display: block;
        position: fixed;
        z-index: -1;
        transform: translateZ(0);
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: url(${objectURLForPC}) no-repeat center/cover;
      }`;
    } else if (styleElement && deviceType === 'mobile') {
      styleElement.textContent = `
      body:before {
        content: '';
        display: block;
        position: fixed;
        z-index: -1;
        transform: translateZ(0);
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: url(${objectURLForMobile}) no-repeat center/cover;
      }`;
    }
    return () => {
      if (styleElement && styleElementTextContent) {
        styleElement.textContent = styleElementTextContent;
      }
    };
  }, [deviceType, objectURLForMobile, objectURLForPC, styleElementTextContent]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    const imageElement = new Image();

    imageElement.onload = () => {
      const canvasForPC = makeCanvas(imageElement, appropriateImageWidthForPC);
      canvasForPC?.toBlob(blob => {
        setObjectURLForPC(window.URL.createObjectURL(blob));
      });

      const canvasForMobile = makeCanvas(
        imageElement,
        appropriateImageWidthForMobile
      );
      canvasForMobile?.toBlob(blob => {
        setObjectURLForMobile(window.URL.createObjectURL(blob));
      });

      const canvasForThumbnail = makeCanvas(
        imageElement,
        appropriateImageWidthForThumbnail
      );
      canvasForThumbnail?.toBlob(blob => {
        setObjectURLForThumbnail(window.URL.createObjectURL(blob));
      });
    };

    const selectedFile = event.target.files[0];
    imageElement.src = window.URL.createObjectURL(selectedFile);
  };

  const cancel = () => {
    window.URL.revokeObjectURL(objectURLForPC);
    window.URL.revokeObjectURL(objectURLForMobile);
    window.URL.revokeObjectURL(objectURLForThumbnail);

    history.goBack();
  };

  return (
    <Fragment>
      <Menu />
      <Box className={classes.root}>
        <Paper className={classes.paper}>
          <input
            ref={inputRef}
            className={classes.input}
            type='file'
            onChange={handleInputChange}
          />
          <Button
            className={classes.button}
            variant='contained'
            size='medium'
            onClick={() => inputRef?.current?.click()}
            style={{
              display: `${
                objectURLForPC && objectURLForMobile && objectURLForThumbnail
                  ? 'none'
                  : 'inline'
              }`
            }}
          >
            Choose File
          </Button>
          <Button
            className={classes.button}
            variant='contained'
            size='medium'
            onClick={() => cancel()}
            style={{
              display: `${
                objectURLForPC && objectURLForMobile && objectURLForThumbnail
                  ? 'inline'
                  : 'none'
              }`
            }}
          >
            Cancel
          </Button>
          <Button
            className={classes.button}
            variant='contained'
            size='medium'
            onClick={() => {}}
            style={{
              display: `${
                objectURLForPC && objectURLForMobile && objectURLForThumbnail
                  ? 'inline'
                  : 'none'
              }`
            }}
          >
            OK
          </Button>
        </Paper>
      </Box>
    </Fragment>
  );
};

export default PostScreen;